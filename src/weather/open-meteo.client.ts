import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fetchWeatherApi } from 'openmeteo';
import {
  IWeatherData,
  IHourlyForecastDetail,
  IForecastResponse,
} from './interfaces/weather.interface';

@Injectable()
export class OpenMeteoClient {
  private readonly logger = new Logger(OpenMeteoClient.name);

  constructor(private readonly config: ConfigService) {}

  async getCurrentForecast(
    latitude: number,
    longitude: number,
  ): Promise<IWeatherData> {
    try {
      const baseUrl = this.config.get<string>('integration.apis.openMeteo');
      if (!baseUrl) {
        throw new Error('OpenMeteo API URL is not configured');
      }
      const params = {
        latitude,
        longitude,
        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'apparent_temperature',
          'precipitation',
          'rain',
          'showers',
          'weather_code',
          'cloud_cover',
          'surface_pressure',
          'wind_speed_10m',
          'wind_direction_10m',
          'wind_gusts_10m',
        ],
        daily: ['uv_index_max', 'precipitation_sum', 'rain_sum'],
        wind_speed_unit: 'ms',
      };

      const url = `${baseUrl}/v1/forecast`;
      const responses = await fetchWeatherApi(url, params);

      if (!responses) {
        throw new Error('Weather data fetch failed');
      }

      const [response] = responses;

      const current = response.current()!;
      const daily = response.daily()!;
      const utcOffsetSeconds = response.utcOffsetSeconds();

      const time = this.range(
        Number(daily.time()),
        Number(daily.timeEnd()),
        daily.interval(),
      ).map((t) => new Date((t + utcOffsetSeconds) * 1000));

      const uvIndexMax = daily.variables(0)!.valuesArray()!;

      const weather: IWeatherData = {
        temperature: Math.round(current.variables(0)!.value()),
        humidity: current.variables(1)!.value(),
        pressure: Math.round(current.variables(8)!.value()),
        feels_like: Math.round(current.variables(2)!.value()),
        wind_speed_10m: Math.round(current.variables(9)!.value()),
        clouds: current.variables(7)!.value(),
        uvi: Math.round(
          uvIndexMax.reduce((acc, prev) => acc + prev, 0) / time.length,
        ),
        description: '', // We might want to populate this if possible, but user code had it empty or dependent on something else.
        // The user's code had `description: '',` and `icon: '',` in `fetchOpenMeteoWeatherData`.
        // However, the user's `fetchWeatherData` (the first function in the prompt, using `fetch`) had description from `data.current.weather[0].description`.
        // The `fetchOpenMeteoWeatherData` used `fetchWeatherApi` and had empty description.
        // I will stick to the user's `fetchOpenMeteoWeatherData` implementation for `description` and `icon`.
        icon: '',
        alerts: [],
      };

      return weather;
    } catch (error) {
      this.logger.error('Error fetching weather data:', error);
      throw error;
    }
  }

  async fetchHistorical(
    latitude: number,
    longitude: number,
    dateTime: Date,
  ): Promise<IWeatherData | undefined> {
    try {
      const baseUrl = this.config.get<string>(
        'integration.apis.openMeteoArchive',
      );

      if (!baseUrl) {
        throw new Error('OpenMeteo Archive API URL is not configured');
      }

      const url = `${baseUrl}/v1/forecast`;

      const params = {
        latitude,
        longitude,
        start_date: this.getDateRange(dateTime),
        end_date: this.getDateRange(dateTime),
        hourly: [
          'temperature_2m',
          'wind_speed_10m',
          'precipitation',
          'relative_humidity_2m',
          'cloud_cover',
          'pressure_msl',
        ],
        daily: [],
        wind_speed_unit: 'ms',
        timezone: 'auto',
      };

      const responses = await fetchWeatherApi(url, params);

      if (!responses) {
        throw new Error('Weather historical data fetch failed');
      }

      const [response] = responses;

      const hourly = response.hourly()!;
      const utcOffsetSeconds = response.utcOffsetSeconds();

      const time = this.range(
        Number(hourly.time()),
        Number(hourly.timeEnd()),
        hourly.interval(),
      ).map((t) => new Date((t + utcOffsetSeconds) * 1000));

      const temperature2m = hourly.variables(0)!.valuesArray()!;
      const windSpeed10m = hourly.variables(1)!.valuesArray()!;
      const relativeHumidity2m = hourly.variables(3)!.valuesArray()!;
      const cloudCover = hourly.variables(4)!.valuesArray()!;
      const pressureMsl = hourly.variables(5)!.valuesArray()!;

      const isTemperatureValuesValid =
        temperature2m.filter((item) => !Number.isNaN(item)).length ===
        temperature2m.length;
      const isWindValuesValid =
        windSpeed10m.filter((item) => !Number.isNaN(item)).length ===
        windSpeed10m.length;
      const isHumidityValuesValid =
        relativeHumidity2m.filter((item) => !Number.isNaN(item)).length ===
        relativeHumidity2m.length;
      const isCloudCoverValuesValid =
        cloudCover.filter((item) => !Number.isNaN(item)).length ===
        cloudCover.length;
      const isPressureValuesValid =
        pressureMsl.filter((item) => !Number.isNaN(item)).length ===
        pressureMsl.length;

      const weather: IWeatherData = {
        temperature: isTemperatureValuesValid
          ? Math.round(
              temperature2m.reduce((acc, prev) => acc + prev, 0) / time.length,
            )
          : undefined,
        humidity: isHumidityValuesValid
          ? Math.round(
              relativeHumidity2m.reduce((acc, prev) => acc + prev, 0) /
                time.length,
            )
          : undefined,
        pressure: isPressureValuesValid
          ? Math.round(
              pressureMsl.reduce((acc, prev) => acc + prev, 0) / time.length,
            )
          : undefined,
        feels_like: undefined,
        wind_speed_10m: isWindValuesValid
          ? Math.round(
              windSpeed10m.reduce((acc, prev) => acc + prev, 0) / time.length,
            )
          : undefined,
        clouds: isCloudCoverValuesValid
          ? Math.round(
              cloudCover.reduce((acc, prev) => acc + prev, 0) / time.length,
            )
          : undefined,
        uvi: undefined,
        description: '',
        icon: '',
        alerts: [],
      };

      return weather;
    } catch (error) {
      this.logger.error('Error fetching historical weather data:', error);
      throw error;
    }
  }

  async fetchHourlyForecast(
    latitude: number,
    longitude: number,
    start: Date,
    end: Date,
  ): Promise<IHourlyForecastDetail[]> {
    try {
      const baseUrl = this.config.get<string>('integration.apis.openMeteo');
      if (!baseUrl) {
        throw new Error('OpenMeteo API URL is not configured');
      }
      const params = {
        latitude,
        longitude,
        start_date: this.getDateRange(start),
        end_date: this.getDateRange(end),
        hourly: [
          'temperature_2m',
          'relative_humidity_2m',
          'surface_pressure',
          'wind_speed_10m',
          'cloud_cover',
          'direct_radiation',
          'uv_index',
        ],
        wind_speed_unit: 'ms',
      };

      const url = `${baseUrl}/v1/forecast`;
      const responses = await fetchWeatherApi(url, params);

      if (!responses) {
        throw new Error('Weather data fetch failed');
      }

      const [response] = responses;
      const hourly = response.hourly()!;
      const utcOffsetSeconds = response.utcOffsetSeconds();

      const time = this.range(
        Number(hourly.time()),
        Number(hourly.timeEnd()),
        hourly.interval(),
      ).map((t) => new Date((t + utcOffsetSeconds) * 1000));

      const temperature2m = hourly.variables(0)!.valuesArray()!;
      const relativeHumidity2m = hourly.variables(1)!.valuesArray()!;
      const surfacePressure = hourly.variables(2)!.valuesArray()!;
      const windSpeed10m = hourly.variables(3)!.valuesArray()!;
      const cloudCover = hourly.variables(4)!.valuesArray()!;
      const directRadiation = hourly.variables(5)!.valuesArray()!;
      const uvIndex = hourly.variables(6)!.valuesArray()!;

      return time.map((t, i) => ({
        datetime: t.toISOString(),
        temperature: temperature2m[i],
        humidity: relativeHumidity2m[i],
        pressure: surfacePressure[i],
        windSpeed: windSpeed10m[i],
        clouds: cloudCover[i],
        directRadiation: directRadiation[i],
        uvi: uvIndex[i],
        description: '', // description is not available in hourly forecast easily without weather code mapping
      }));
    } catch (error) {
      this.logger.error('Error fetching hourly forecast:', error);
      throw error;
    }
  }

  async getForecast(
    latitude: number | undefined,
    longitude: number | undefined,
  ): Promise<IForecastResponse> {
    if (latitude === undefined || longitude === undefined) {
      throw new Error('Latitude and Longitude must be provided');
    }

    const params = {
      latitude,
      longitude,
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'weather_code',
        'cloud_cover',
        'surface_pressure',
      ],
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
      ],
      timezone: 'auto',
      forecast_days: 3,
    };

    const baseUrl = this.config.get<string>('integration.apis.openMeteo');

    if (!baseUrl) {
      throw new Error('OpenMeteo Archive API URL is not configured');
    }

    try {
      const url = `${baseUrl}/v1/forecast`;
      const responses = await fetchWeatherApi(url, params);
      const response = responses[0]; // Process first location

      const utcOffsetSeconds = response.utcOffsetSeconds();
      const timezone = response.timezone();

      const hourly = response.hourly()!;
      const daily = response.daily()!;

      // Map Hourly Data
      const hourlyData = {
        time: this.range(
          Number(hourly.time()),
          Number(hourly.timeEnd()),
          hourly.interval(),
        ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
        temperature: hourly.variables(0)!.valuesArray()!,
        humidity: hourly.variables(1)!.valuesArray()!,
        weatherCode: hourly.variables(2)!.valuesArray()!,
        cloudCover: hourly.variables(3)!.valuesArray(),
        surfacePressure: hourly.variables(4)!.valuesArray(),
      };

      // Map Daily Data
      const dailyData = {
        time: this.range(
          Number(daily.time()),
          Number(daily.timeEnd()),
          daily.interval(),
        ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
        weatherCode: daily.variables(0)!.valuesArray()!,
        temperatureMax: daily.variables(1)!.valuesArray()!,
        temperatureMin: daily.variables(2)!.valuesArray()!,
        precipitationSum: daily.variables(3)!.valuesArray()!,
      };

      return {
        latitude: response.latitude(),
        longitude: response.longitude(),
        timezone: timezone || 'UTC',
        hourly: hourlyData.time.map((time, i) => ({
          time,
          temperature: hourlyData.temperature[i],
          humidity: hourlyData.humidity[i],
          weatherCode: hourlyData.weatherCode[i],
          cloudCover: hourlyData.cloudCover
            ? hourlyData.cloudCover[i]
            : undefined,
          surfacePressure: hourlyData.surfacePressure
            ? hourlyData.surfacePressure[i]
            : undefined,
        })),
        daily: dailyData.time.map((time, i) => ({
          date: time,
          weatherCode: dailyData.weatherCode[i],
          temperatureMax: dailyData.temperatureMax[i],
          temperatureMin: dailyData.temperatureMin[i],
          precipitationSum: dailyData.precipitationSum[i],
        })),
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch forecast for lat:${latitude}, lon:${longitude}`,
        error,
        params,
      );
      throw error;
    }
  }

  private getDateRange(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private range(start: number, stop: number, step: number): number[] {
    return Array.from(
      { length: (stop - start) / step },
      (_, i) => start + i * step,
    );
  }
}
