import { Test, TestingModule } from '@nestjs/testing';
import { RiskCalculatorService } from './risk-calculator.service';
import { IHourlyForecast } from '../../weather/interfaces/weather.interface';

describe('RiskCalculatorService', () => {
  let service: RiskCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskCalculatorService],
    }).compile();

    service = module.get<RiskCalculatorService>(RiskCalculatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateRisk', () => {
    const baseWeather: IHourlyForecast = {
      time: new Date(),
      temperature: 20,
      humidity: 50,
      surfacePressure: 1013,
      cloudCover: 40,
      uvIndex: 3,
      weatherCode: 0,
    };

    it('should calculate risk with default weights', () => {
      const risk = service.calculateRisk(baseWeather, {});
      expect(risk).toBeGreaterThanOrEqual(0);
      expect(risk).toBeLessThanOrEqual(100);
    });

    it('should increase weather score for low pressure', () => {
      const lowPressureWeather = { ...baseWeather, surfacePressure: 995 };
      const normalRisk = service.calculateRisk(baseWeather, {});
      const lowPressureRisk = service.calculateRisk(lowPressureWeather, {});

      expect(lowPressureRisk).toBeGreaterThan(normalRisk);
    });

    it('should increase weather score for high cloud cover', () => {
      const highCloudWeather = { ...baseWeather, cloudCover: 85 };
      const normalRisk = service.calculateRisk(baseWeather, {});
      const cloudyRisk = service.calculateRisk(highCloudWeather, {});

      expect(cloudyRisk).toBeGreaterThan(normalRisk);
    });

    it('should increase weather score for high humidity', () => {
      const highHumidityWeather = { ...baseWeather, humidity: 75 };
      const normalRisk = service.calculateRisk(baseWeather, {});
      const humidRisk = service.calculateRisk(highHumidityWeather, {});

      expect(humidRisk).toBeGreaterThan(normalRisk);
    });

    it('should increase weather score for high temperature', () => {
      const hotWeather = { ...baseWeather, temperature: 32 };
      const normalRisk = service.calculateRisk(baseWeather, {});
      const hotRisk = service.calculateRisk(hotWeather, {});

      expect(hotRisk).toBeGreaterThan(normalRisk);
    });

    it('should increase weather score for low temperature', () => {
      const coldWeather = { ...baseWeather, temperature: 5 };
      const normalRisk = service.calculateRisk(baseWeather, {});
      const coldRisk = service.calculateRisk(coldWeather, {});

      expect(coldRisk).toBeGreaterThan(normalRisk);
    });

    it('should increase solar score for high kpIndex', () => {
      const highKp = { kpIndex: 6 };
      const mediumKp = { kpIndex: 3 };
      const lowKp = { kpIndex: 1 };

      const highRisk = service.calculateRisk(baseWeather, highKp);
      const mediumRisk = service.calculateRisk(baseWeather, mediumKp);
      const lowRisk = service.calculateRisk(baseWeather, lowKp);

      expect(highRisk).toBeGreaterThan(mediumRisk);
      expect(mediumRisk).toBeGreaterThan(lowRisk);
    });

    it('should increase history score for recent incident', () => {
      const now = new Date();
      const recentIncident = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
      const oldIncident = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      const recentRisk = service.calculateRisk(baseWeather, {}, recentIncident);
      const oldRisk = service.calculateRisk(baseWeather, {}, oldIncident);
      const noHistoryRisk = service.calculateRisk(baseWeather, {});

      expect(recentRisk).toBeGreaterThan(oldRisk);
      expect(oldRisk).toBeGreaterThan(noHistoryRisk);
    });

    it('should respect custom weights', () => {
      const highSolarWeather = { ...baseWeather };
      const solar = { kpIndex: 6 };

      const defaultWeights = service.calculateRisk(
        highSolarWeather,
        solar,
        undefined,
      );
      const highSolarWeight = service.calculateRisk(
        highSolarWeather,
        solar,
        undefined,
        { weather: 10, solar: 80, history: 10 },
      );
      const lowSolarWeight = service.calculateRisk(
        highSolarWeather,
        solar,
        undefined,
        { weather: 80, solar: 10, history: 10 },
      );

      expect(highSolarWeight).toBeGreaterThan(defaultWeights);
      expect(lowSolarWeight).toBeLessThan(defaultWeights);
    });

    it('should cap risk at 100', () => {
      const extremeWeather: IHourlyForecast = {
        ...baseWeather,
        surfacePressure: 980,
        cloudCover: 95,
        humidity: 85,
        temperature: 35,
      };
      const extremeSolar = { kpIndex: 9 };
      const veryRecentIncident = new Date(Date.now() - 1000 * 60 * 10); // 10 minutes ago

      const risk = service.calculateRisk(
        extremeWeather,
        extremeSolar,
        veryRecentIncident,
      );

      expect(risk).toBeLessThanOrEqual(100);
    });

    it('should handle missing solar data', () => {
      const risk = service.calculateRisk(baseWeather, {});
      expect(risk).toBeGreaterThanOrEqual(0);
      expect(risk).toBeLessThanOrEqual(100);
    });

    it('should handle missing last incident date', () => {
      const risk = service.calculateRisk(baseWeather, { kpIndex: 3 });
      expect(risk).toBeGreaterThanOrEqual(0);
      expect(risk).toBeLessThanOrEqual(100);
    });

    it('should calculate cumulative risk from multiple factors', () => {
      const badWeather: IHourlyForecast = {
        ...baseWeather,
        surfacePressure: 990,
        cloudCover: 85,
        humidity: 75,
        temperature: 33,
      };
      const highSolar = { kpIndex: 5 };
      const recentIncident = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

      const cumulativeRisk = service.calculateRisk(
        badWeather,
        highSolar,
        recentIncident,
      );
      const baselineRisk = service.calculateRisk(baseWeather, {});

      expect(cumulativeRisk).toBeGreaterThan(baselineRisk);
    });
  });
});
