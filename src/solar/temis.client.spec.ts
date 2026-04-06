import { Test, TestingModule } from '@nestjs/testing';
import { TemisClient } from './temis.client';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { IStation } from './interfaces/radiation.interface';
import { mockGlobalFetch } from '../../test/helper/fetch-mock';

describe('TemisClient', () => {
  let service: TemisClient;
  let mockData: string = '';
  let module: TestingModule;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };
  beforeEach(async () => {
    mockData = `
# TEMIS v2.0 UV index and UV dose overpass file
# =============================================
# http://www.temis.nl/uvradiation/UVarchive.html
#
# Station name     = Vilnius
# Station country  = Lithuania
# Station lon, lat = 25.28, 54.69
#
# Grid cell size              = 0.25 x 0.25 degrees
# Grid cell centre lon, lat   = 25.375, 54.625
# Grid cell average elevation = 180 (+/- 35) m
# Grid cell within MSG area   = yes
#
# Data columns:
#      1 = YYYYMMDD        : date string
#   2, 3 = UVIEF, UVIEFerr : cloud-free erythemal UV index      [-]
#   4, 5 = UVDEF, UVDEFerr : cloud-free     erythemal  UV dose  [kJ/m2]
#   6, 7 = UVDEC, UVDECerr : cloud-modified erythemal  UV dose  [kJ/m2]
#   8, 9 = UVDVF, UVDVFerr : cloud-free     vitamin-D  UV dose  [kJ/m2]
#  10,11 = UVDVC, UVDVCerr : cloud-modified vitamin-D  UV dose  [kJ/m2]
#  12,13 = UVDDF, UVDDFerr : cloud-free     dna-damage UV dose  [kJ/m2]
#  14,15 = UVDDC, UVDDCerr : cloud-modified dna-damage UV dose  [kJ/m2]
#     16 = CMF             : average cloud modification factor  [-]
#     17 = ozone           : local solar noon ozone column      [DU]
# 
# No-data entry = -1.000
#
#
# YYYYMMDD    UVIEF UVIEFerr  UVDEF UVDEFerr  UVDEC UVDECerr  UVDVF UVDVFerr  UVDVC UVDVCerr  UVDDF UVDDFerr  UVDDC UVDDCerr  CMF    ozone
  20020701    5.935   0.409   3.755   0.299  -1.000  -1.000   6.479   0.738  -1.000  -1.000   1.586   0.252  -1.000  -1.000  -1.000  348.6
  20020702    6.161   0.409   3.885   0.299  -1.000  -1.000   6.781   0.735  -1.000  -1.000   1.694   0.252  -1.000  -1.000  -1.000  338.3
`;
    module = await Test.createTestingModule({
      providers: [
        TemisClient,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<TemisClient>(TemisClient);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStations', () => {
    it('should fetch and parse stations if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('http://base-url-0');
      const html = `
        <table>
          <tr><td>Header</td></tr>
          <tr>
            <td><a href="station_url">Station 1</a></td>
            <td>10.5</td>
            <td>20.5</td>
          </tr>
        </table>
      `;
      mockGlobalFetch({
        ok: true,
        status: 200,
        data: html,
        stringifyData: false,
      });

      const result = await service.getStations();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        title: 'Station 1',
        url: 'station_url',
        longitude: 10.5,
        latitude: 20.5,
      });
      expect(mockCacheManager.set).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://base-url-0/UVarchive/stations_uv.php',
      );
    });

    it('should fetch and parse stations if not cached and missing station url', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('http://base-url-1');
      const html = `
        <table>
          <tr><td>Header</td></tr>
          <tr>
            <td><a href="">Station 1</a></td>
            <td>10.5</td>
            <td>20.5</td>
          </tr>
        </table>
      `;
      mockGlobalFetch({
        ok: true,
        status: 200,
        data: html,
        stringifyData: false,
      });

      const result = await service.getStations();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        title: 'Station 1',
        url: '',
        longitude: 10.5,
        latitude: 20.5,
      });
      expect(mockCacheManager.set).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://base-url-1/UVarchive/stations_uv.php',
      );
    });

    it('should return empty array if data is missing', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('http://base-url-3');
      mockGlobalFetch({
        ok: true,
        status: 200,
        data: null,
        stringifyData: false,
      });

      const result = await service.getStations();
      expect(result).toEqual([]);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://base-url-3/UVarchive/stations_uv.php',
      );
    });

    it('should return cached stations if available', async () => {
      const cachedStations: IStation[] = [
        {
          title: 'Test',
          url: 'http://test.com',
          latitude: 10,
          longitude: 20,
        },
      ];
      mockCacheManager.get.mockResolvedValue(cachedStations);

      const result = await service.getStations();
      expect(result).toEqual(cachedStations);
      expect(mockCacheManager.get).toHaveBeenCalledWith('stations_temis');
      expect(global.fetch).not.toHaveBeenCalledWith('http://test.com');
    });
  });

  describe('getClosestStation', () => {
    it('should return the closest station', async () => {
      const stations: IStation[] = [
        { title: 'Far', url: 'url1', latitude: 0, longitude: 0 },
        { title: 'Close', url: 'url2', latitude: 10, longitude: 10 },
      ];
      // Mock getStations to return our list
      jest.spyOn(service, 'getStations').mockResolvedValue(stations);

      const result = await service.getClosestStation(10.1, 10.1);
      expect(result?.title).toBe('Close');
    });
  });

  describe('transform', () => {
    it('should parse valid data correctly', () => {
      const date = '20020701';
      mockCacheManager.get.mockResolvedValue(null);
      const expectedResult = {
        CMF: -1.0,
        cloud_Free_DNA_damage_UV_dose: 1.586,
        cloud_Free_DNA_damage_UV_dose_error: 0.252,
        cloud_Free_Erythemal_UV_dose: 3.755,
        cloud_Free_Erythemal_UV_dose_error: 0.299,
        cloud_Free_Erythemal_UV_index: 5.935,
        cloud_Free_Erythemal_UV_index_error: 0.409,
        cloud_Free_Vitamin_D_UV_dose: 6.479,
        cloud_Free_Vitamin_D_UV_dose_error: 0.738,
        cloud_Modified_DNA_damage_UV_dose: -1.0,
        cloud_Modified_DNA_damage_UV_dose_error: -1.0,
        cloud_Modified_Erythemal_UV_dose: -1.0,
        cloud_Modified_Erythemal_UV_dose_error: -1.0,
        cloud_Modified_Vitamin_D_UV_dose: -1.0,
        cloud_Modified_Vitamin_D_UV_dose_error: -1.0,
        date: '20020701',
        ozone: 348.6,
      };

      const result = service.transform(mockData, date);
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
    });

    it('should return cached data', () => {
      const date = '20020701';

      const expectedResult = {
        CMF: -1.0,
        cloud_Free_DNA_damage_UV_dose: 1.586,
        cloud_Free_DNA_damage_UV_dose_error: 0.252,
        cloud_Free_Erythemal_UV_dose: 3.755,
        cloud_Free_Erythemal_UV_dose_error: 0.299,
        cloud_Free_Erythemal_UV_index: 5.935,
        cloud_Free_Erythemal_UV_index_error: 0.409,
        cloud_Free_Vitamin_D_UV_dose: 6.479,
        cloud_Free_Vitamin_D_UV_dose_error: 0.738,
        cloud_Modified_DNA_damage_UV_dose: -1.0,
        cloud_Modified_DNA_damage_UV_dose_error: -1.0,
        cloud_Modified_Erythemal_UV_dose: -1.0,
        cloud_Modified_Erythemal_UV_dose_error: -1.0,
        cloud_Modified_Vitamin_D_UV_dose: -1.0,
        cloud_Modified_Vitamin_D_UV_dose_error: -1.0,
        date: '20020701',
        ozone: 348.6,
      };
      mockCacheManager.get.mockResolvedValue(expectedResult);

      const result = service.transform(mockData, date);
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
    });

    it('should parse valid data correctly some values convertyed to zero', () => {
      const date = '20020701';

      mockCacheManager.get.mockResolvedValue(null);
      mockData = `# TEMIS v2.0 UV index and UV dose overpass file
# =============================================
# http://www.temis.nl/uvradiation/UVarchive.html
#
# Station name     = Vilnius
# Station country  = Lithuania
# Station lon, lat = 25.28, 54.69
#
# Grid cell size              = 0.25 x 0.25 degrees
# Grid cell centre lon, lat   = 25.375, 54.625
# Grid cell average elevation = 180 (+/- 35) m
# Grid cell within MSG area   = yes
#
# Data columns:
#      1 = YYYYMMDD        : date string
#   2, 3 = UVIEF, UVIEFerr : cloud-free erythemal UV index      [-]
#   4, 5 = UVDEF, UVDEFerr : cloud-free     erythemal  UV dose  [kJ/m2]
#   6, 7 = UVDEC, UVDECerr : cloud-modified erythemal  UV dose  [kJ/m2]
#   8, 9 = UVDVF, UVDVFerr : cloud-free     vitamin-D  UV dose  [kJ/m2]
#  10,11 = UVDVC, UVDVCerr : cloud-modified vitamin-D  UV dose  [kJ/m2]
#  12,13 = UVDDF, UVDDFerr : cloud-free     dna-damage UV dose  [kJ/m2]
#  14,15 = UVDDC, UVDDCerr : cloud-modified dna-damage UV dose  [kJ/m2]
#     16 = CMF             : average cloud modification factor  [-]
#     17 = ozone           : local solar noon ozone column      [DU]
# 
# No-data entry = -1.000
#
#
# YYYYMMDD    UVIEF UVIEFerr  UVDEF UVDEFerr  UVDEC UVDECerr  UVDVF UVDVFerr  UVDVC UVDVCerr  UVDDF UVDDFerr  UVDDC UVDDCerr  CMF    ozone
  20020701    5.935   a   3.755   0.299  -1.000  -1.000   6.479   0.738  -1.000  -1.000   1.586   0.252  -1.000  -1.000  -1.000  348.6
  20020702    6.161   0.409   3.885   0.299  -1.000  -1.000   6.781   0.735  -1.000  -1.000   1.694   0.252  -1.000  -1.000  -1.000  338.3
`;
      const expectedResult = {
        CMF: -1.0,
        cloud_Free_DNA_damage_UV_dose: 1.586,
        cloud_Free_DNA_damage_UV_dose_error: 0.252,
        cloud_Free_Erythemal_UV_dose: 3.755,
        cloud_Free_Erythemal_UV_dose_error: 0.299,
        cloud_Free_Erythemal_UV_index: 5.935,
        cloud_Free_Erythemal_UV_index_error: 0,
        cloud_Free_Vitamin_D_UV_dose: 6.479,
        cloud_Free_Vitamin_D_UV_dose_error: 0.738,
        cloud_Modified_DNA_damage_UV_dose: -1.0,
        cloud_Modified_DNA_damage_UV_dose_error: -1.0,
        cloud_Modified_Erythemal_UV_dose: -1.0,
        cloud_Modified_Erythemal_UV_dose_error: -1.0,
        cloud_Modified_Vitamin_D_UV_dose: -1.0,
        cloud_Modified_Vitamin_D_UV_dose_error: -1.0,
        date: '20020701',
        ozone: 348.6,
      };

      const result = service.transform(mockData, date);
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
    });

    it('should return undefined if date not found', () => {
      mockData = `
# YYYYMMDD ...
  20020701 ...
        `;
      const date = '20230101';

      mockCacheManager.get.mockResolvedValue(null);

      const result = service.transform(mockData, date);
      expect(result).toBeUndefined();
    });

    it('should return undefined if data undefined', () => {
      const date = '20230101';

      mockCacheManager.get.mockResolvedValue(null);

      const result = service.transform(undefined, date);
      expect(result).toBeUndefined();
    });
  });

  describe('getUVData', () => {
    it('should return UV data for valid coordinates', async () => {
      const station: IStation = {
        title: 'Station',
        url: 'http://station.url-1',
        latitude: 50,
        longitude: 10,
      };
      jest.spyOn(service, 'getClosestStation').mockResolvedValue(station);

      mockGlobalFetch({
        ok: true,
        status: 200,
        data: mockData,
        stringifyData: false,
      });

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2002-07-01'));

      const result = await service.getUVData(50, 10);

      expect(result).toBeDefined();
      expect(result?.date).toBe('20020701');

      jest.useRealTimers();
      expect(global.fetch).toHaveBeenCalledWith('http://station.url-1');
    });

    it('should throw error if no closest station', async () => {
      jest.spyOn(service, 'getClosestStation').mockResolvedValue(null);
      await expect(service.getUVData(0, 0)).rejects.toThrow(
        'no closest station',
      );
    });

    it('should throw error if no closest url station', async () => {
      const station: IStation = {
        title: 'Station',
        url: '',
        latitude: 50,
        longitude: 10,
      };
      jest.spyOn(service, 'getClosestStation').mockResolvedValue(station);
      await expect(service.getUVData(0, 0)).rejects.toThrow(
        'no closest station',
      );
    });

    it('should return undefined on fetch error', async () => {
      const station: IStation = {
        title: 'Station',
        url: 'http://station.url',
        latitude: 50,
        longitude: 10,
      };
      jest.spyOn(service, 'getClosestStation').mockResolvedValue(station);
      mockGlobalFetch({
        ok: false,
        status: 500,
        errorMessage: 'Empty response',
      });

      const result = await service.getUVData(50, 10);
      expect(result).toBeUndefined();
    });
  });
});
