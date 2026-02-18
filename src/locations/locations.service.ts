import { createHash } from 'crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DateTime } from 'luxon';
import { Location, LocationDocument } from './schemas/locations.schema';
import { CreateLocationDto } from './dto/create-locations.dto';
import { UpdateLocationDto } from './dto/update-locations.dto';
import { GetSummaryQueryDto } from './dto/summary.dto';
import { ILocation } from './interfaces/locations.interface';
import {
  ISummaryResponse,
  IRadiationMappedData,
  IPlanetaryKindexMappedData,
  IOpenMeteoData,
} from './interfaces/summary.interface';
import { EncryptionService } from '../auth/encryption/encryption.service';
import { WeatherService } from '../weather/weather.service';
import { SolarWeatherService } from '../solar/solar-weather.service';
import { IKPIData } from '../solar/interfaces/radiation.interface';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    private readonly encryptionService: EncryptionService,
    private readonly weatherService: WeatherService,
    private readonly solarWeatherService: SolarWeatherService,
  ) {}

  async create(
    createLocationDto: CreateLocationDto,
    key: string,
  ): Promise<ILocation> {
    const bufferKey = createHash('sha256').update(key).digest();
    const createdLocation = new this.locationModel({
      ...createLocationDto,
      latitude: this.encryptionService.encryptSensitiveData(
        createLocationDto.latitude.toString(),
        bufferKey,
      ),
      longitude: this.encryptionService.encryptSensitiveData(
        createLocationDto.longitude.toString(),
        bufferKey,
      ),
      datetimeAt: this.encryptionService.encryptSensitiveData(
        createLocationDto.datetimeAt,
        bufferKey,
      ),
    });

    const savedLocation = await createdLocation.save();
    return this.mapToILocation(savedLocation, key);
  }

  async findAll(key: string, userId: string): Promise<ILocation[]> {
    const locations = await this.locationModel.find({ userId }).exec();
    return locations
      .map((location) => this.mapToILocation(location, key))
      .filter((item) => !!item);
  }

  async findOne(id: string, key: string, userId: string): Promise<ILocation> {
    const location = await this.locationModel.findById(id).exec();
    if (!location) {
      throw new NotFoundException(`Location with ID "${id}" not found`);
    }

    if (location.userId !== userId) {
      throw new ForbiddenException(`Access denied to location "${id}"`);
    }

    return this.mapToILocation(location, key);
  }

  async findByIncidentId(
    incidentId: string,
    key: string,
    userId: string,
  ): Promise<ILocation> {
    const location = await this.locationModel
      .findOne({ incidentId, userId })
      .exec();

    if (!location) {
      throw new NotFoundException(
        `Location for incident ID "${incidentId}" not found`,
      );
    }

    return this.mapToILocation(location, key);
  }

  async update(
    id: string,
    updateLocationDto: UpdateLocationDto,
    key: string,
    userId: string,
  ): Promise<ILocation> {
    const location = await this.locationModel.findById(id).exec();
    if (!location) {
      throw new NotFoundException(`Location with ID "${id}" not found`);
    }

    if (location.userId !== userId) {
      throw new ForbiddenException(`Access denied to location "${id}"`);
    }

    const bufferKey = createHash('sha256').update(key).digest();
    const encryptedUpdate: Partial<Location> = {
      incidentId: updateLocationDto.incidentId,
      solarRadiation: updateLocationDto.solarRadiation,
      solar: updateLocationDto.solar,
      forecast: updateLocationDto.forecast,
      userId: updateLocationDto.userId,
    };

    // Remove fields that shouldn't be in the spread if they are undefined or need transformation
    if (updateLocationDto.latitude !== undefined) {
      encryptedUpdate.latitude = this.encryptionService.encryptSensitiveData(
        updateLocationDto.latitude.toString(),
        bufferKey,
      );
    }

    if (updateLocationDto.longitude !== undefined) {
      encryptedUpdate.longitude = this.encryptionService.encryptSensitiveData(
        updateLocationDto.longitude.toString(),
        bufferKey,
      );
    }

    if (updateLocationDto.datetimeAt !== undefined) {
      encryptedUpdate.datetimeAt = this.encryptionService.encryptSensitiveData(
        new Date(updateLocationDto.datetimeAt).toISOString(),
        bufferKey,
      );
    }

    const updatedLocation = await this.locationModel
      .findByIdAndUpdate(id, encryptedUpdate, { new: true })
      .exec();

    if (!updatedLocation) {
      throw new NotFoundException(`Location with ID "${id}" not found`);
    }
    return this.mapToILocation(updatedLocation, key);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.locationModel
      .deleteOne({ _id: id, userId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Location with ID "${id}" not found`);
    }
  }

  async getSummary(
    query: GetSummaryQueryDto,
    userId: string,
  ): Promise<ISummaryResponse> {
    const { id, incidentId, isoDate, latitude, longitude } = query;

    const dt = isoDate ? DateTime.fromISO(isoDate) : DateTime.now();
    const dtUtc = dt.setZone('UTC');
    const result: ISummaryResponse = {
      datetimeAt: dtUtc.isValid ? dtUtc.toISO() : '',
      forecast: [],
      id,
      incidentId,
      latitude,
      longitude,
      solar: [],
      solarRadiation: [],
      userId,
    };

    if (!dt.isValid) {
      return result;
    }

    // Weather Forecast (OpenMeteo)
    try {
      // Fetch -1 day to +1 day (3 days total)
      const start = dt.minus({ days: 1 });
      const end = dt.plus({ days: 1 });

      const hourlyForecast = await this.weatherService.getHourlyForecast(
        latitude,
        longitude,
        start.toJSDate(),
        end.toJSDate(),
        userId,
      );

      // Filter/Slice logic similar to legacy:
      // constructing the window manually:
      // Day before: last 2 hours? Legacy: `dayBeforeMeteo.slice(-2)`
      // Current day: all
      // Day after: first 2 hours? Legacy: `dayAfterMeteo.slice(0, 2)`

      const dayBeforeStr = start.toFormat('yyyy-MM-dd');
      const currentDayStr = dt.toFormat('yyyy-MM-dd');
      const dayAfterStr = end.toFormat('yyyy-MM-dd');

      const dayBeforeData = hourlyForecast.filter((d) =>
        d.datetime.startsWith(dayBeforeStr),
      );
      const currentData = hourlyForecast.filter((d) =>
        d.datetime.startsWith(currentDayStr),
      );
      const dayAfterData = hourlyForecast.filter((d) =>
        d.datetime.startsWith(dayAfterStr),
      );

      result.forecast = [
        ...(dayBeforeData.length ? dayBeforeData.slice(-2) : []),
        ...currentData,
        ...(dayAfterData.length ? dayAfterData.slice(0, 2) : []),
      ] as IOpenMeteoData[];
    } catch (e) {
      Logger.error('Error fetching OpenMeteo summary', e);
    }

    // Radiation (TEMIS)
    let closestStation = null;
    try {
      closestStation = await this.solarWeatherService.getClosestStation(
        latitude,
        longitude,
      );
      if (closestStation) {
        Logger.log(`closest station ${closestStation.title}`);
        const [radiationDataBefore, radiationDataCurrent, radiationDataAfter] =
          await Promise.all([
            this.fetchAndMapRadiationData(
              closestStation.url,
              dt.minus({ days: 1 }),
              userId,
            ),
            this.fetchAndMapRadiationData(closestStation.url, dt, userId),
            this.fetchAndMapRadiationData(
              closestStation.url,
              dt.plus({ days: 1 }),
              userId,
            ),
          ]);

        result.solarRadiation = [
          ...(radiationDataBefore ? [radiationDataBefore] : []),
          ...(radiationDataCurrent ? [radiationDataCurrent] : []),
          ...(radiationDataAfter ? [radiationDataAfter] : []),
        ];
      }
    } catch (e) {
      Logger.error('Error fetching Radiation summary', e);
    }

    // KPI (GFZ)
    try {
      const [kpiDataCurrent, kpiDataAfter] = await Promise.all([
        this.solarWeatherService.getKpData(dt, userId),
        this.solarWeatherService.getKpData(dt.plus({ days: 1 }), userId),
      ]);

      if (kpiDataCurrent) {
        result.solar = [
          ...result.solar,
          ...this.mapKpiDataToSolar(kpiDataCurrent, dt),
        ];

        // Enhance solarRadiation with KPI flux/sunspot
        const currentDayRadiationIndex = result.solarRadiation.findIndex(
          (data) => {
            // date in mapped data is 'yyyyMMdd' from fetchAndMapRadiationData
            return data.date === dt.toFormat('yyyyMMdd');
          },
        );
        if (currentDayRadiationIndex !== -1) {
          result.solarRadiation[currentDayRadiationIndex].solarFlux =
            kpiDataCurrent.solarFlux;
          result.solarRadiation[currentDayRadiationIndex].sunsPotNumber =
            kpiDataCurrent.sunsPotNumber;
        }
      }

      if (kpiDataAfter) {
        result.solar = [
          ...result.solar,
          ...this.mapKpiDataToSolar(kpiDataAfter, dt.plus({ days: 1 })).slice(
            0,
            3,
          ),
        ];

        const dayAfterRadiationIndex = result.solarRadiation.findIndex(
          (data) => data.date === dt.plus({ days: 1 }).toFormat('yyyyMMdd'),
        );
        if (dayAfterRadiationIndex !== -1) {
          result.solarRadiation[dayAfterRadiationIndex].solarFlux =
            kpiDataAfter.solarFlux;
          result.solarRadiation[dayAfterRadiationIndex].sunsPotNumber =
            kpiDataAfter.sunsPotNumber;
        }
      }
    } catch (e) {
      Logger.error('Error fetching KPI summary', e);
    }

    // Formatting Radiation Dates
    result.solarRadiation = result.solarRadiation.map((item) => {
      const { date, ...rest } = item;
      const dtItem = DateTime.fromFormat(date, 'yyyyMMdd');
      return { ...rest, date: dtItem.toFormat('dd LLL yyyy') };
    });

    return result;
  }

  private async fetchAndMapRadiationData(
    stationUrl: string,
    dateTime: DateTime,
    userId?: string,
  ): Promise<IRadiationMappedData | null> {
    try {
      const radiationData = await this.solarWeatherService.getRadiationData(
        stationUrl,
        dateTime.toFormat('yyyyMMdd'),
        userId,
      );
      if (radiationData) {
        return {
          date: dateTime.toFormat('yyyyMMdd'),
          ozone: radiationData.ozone,
          solarFlux: 0,
          sunsPotNumber: 0,
          uvIndex: radiationData.cloud_Free_Erythemal_UV_index,
        };
      }
    } catch (e) {
      Logger.error(
        `Error fetching radiation for ${stationUrl} at ${dateTime.toISO()}`,
        e,
      );
    }
    return null;
  }

  async findByDateRange(
    key: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ILocation[] | []> {
    const locations = await this.locationModel
      .find({
        userId,
        datetimeAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .exec();

    const result = locations
      .map((location) => this.mapToILocation(location, key))
      .filter((item) => !!item);

    return result;
  }

  private mapKpiDataToSolar(
    kpiData: IKPIData,
    dateTime: DateTime,
  ): IPlanetaryKindexMappedData[] {
    if (!kpiData) {
      return [];
    }
    const baseDate = dateTime.toFormat('yyyy-MM-dd');
    return [
      {
        aIndex: kpiData.ap1,
        datetime: `${baseDate}T00:00:00.000Z`,
        flareProbability: null,
        kIndex: kpiData.Kp1,
      },
      {
        aIndex: kpiData.ap2,
        datetime: `${baseDate}T03:00:00.000Z`,
        flareProbability: null,
        kIndex: kpiData.Kp2,
      },
      {
        aIndex: kpiData.ap3,
        datetime: `${baseDate}T06:00:00.000Z`,
        flareProbability: null,
        kIndex: kpiData.Kp3,
      },
      {
        aIndex: kpiData.ap4,
        datetime: `${baseDate}T09:00:00.000Z`,
        flareProbability: null,
        kIndex: kpiData.Kp4,
      },
      {
        aIndex: kpiData.ap5,
        datetime: `${baseDate}T12:00:00.000Z`,
        flareProbability: null,
        kIndex: kpiData.Kp5,
      },
      {
        aIndex: kpiData.ap6,
        datetime: `${baseDate}T15:00:00.000Z`,
        flareProbability: null,
        kIndex: kpiData.Kp6,
      },
      {
        aIndex: kpiData.ap7,
        datetime: `${baseDate}T18:00:00.000Z`,
        flareProbability: null,
        kIndex: kpiData.Kp7,
      },
      {
        aIndex: kpiData.ap8,
        datetime: `${baseDate}T21:00:00.000Z`,
        flareProbability: null,
        kIndex: kpiData.Kp8,
      },
    ];
  }

  private mapToILocation(
    locationDoc: LocationDocument,
    key: string,
  ): ILocation {
    const bufferKey = createHash('sha256').update(key).digest();

    const decrypt = (value: unknown, type: string): string => {
      if (typeof value === 'string') {
        return this.encryptionService.decryptSensitiveData(value, bufferKey);
      }
      throw new Error(`Expected string got ${typeof value} for ${type}`);
    };

    return {
      id: (locationDoc._id as Types.ObjectId).toString(),
      userId: locationDoc.userId,
      latitude: parseFloat(decrypt(locationDoc.latitude, 'latitude')),
      longitude: parseFloat(decrypt(locationDoc.longitude, 'longitude')),
      forecast: locationDoc.forecast,
      solar: locationDoc.solar,
      solarRadiation: locationDoc.solarRadiation,
      createdAt: locationDoc.createdAt,
      datetimeAt: new Date(decrypt(locationDoc.datetimeAt, 'datetimeAt')),
      incidentId: locationDoc.incidentId,
    };
  }
}
