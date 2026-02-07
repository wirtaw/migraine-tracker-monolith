import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { OpenMeteoClient } from './open-meteo.client';
import {
  IWeatherData,
  IHourlyForecastDetail,
  IForecastResponse,
} from './interfaces/weather.interface';
import { UserService } from '../users/users.service';

@Injectable()
export class WeatherService {
  constructor(
    private readonly client: OpenMeteoClient,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly userService: UserService,
  ) {}

  async getCurrentWeather(
    lat: number,
    lon: number,
    userId?: string,
  ): Promise<IWeatherData> {
    const cacheKey = `weather_current_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = await this.cacheManager.get<IWeatherData>(cacheKey);
    if (cached) {
      return cached;
    }

    const weatherData = await this.client.getCurrentForecast(lat, lon);

    if (userId) {
      void this.userService.trackWeatherRequest(userId);
    }

    // 30 minutes TTL (1800000 ms)
    await this.cacheManager.set(cacheKey, weatherData, 1800000);

    return weatherData;
  }

  async getHistorical(
    lat: number,
    lon: number,
    date: Date,
    userId?: string,
  ): Promise<IWeatherData | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    const cacheKey = `weather_historical_${lat.toFixed(2)}_${lon.toFixed(2)}_${dateStr}`;
    const cached = await this.cacheManager.get<IWeatherData>(cacheKey);
    if (cached) {
      return cached;
    }

    const weatherData = await this.client.fetchHistorical(lat, lon, date);

    if (weatherData && userId) {
      void this.userService.trackWeatherRequest(userId);
    }

    // 30 days TTL (2592000000 ms)
    if (weatherData) {
      await this.cacheManager.set(cacheKey, weatherData, 2592000000);
    }

    return weatherData;
  }

  async getHourlyForecast(
    lat: number,
    lon: number,
    start: Date,
    end: Date,
    userId?: string,
  ): Promise<IHourlyForecastDetail[]> {
    const hourlyForecast = await this.client.fetchHourlyForecast(
      lat,
      lon,
      start,
      end,
    );

    if (userId) {
      void this.userService.trackWeatherRequest(userId);
    }

    return hourlyForecast;
  }

  async getForecast(
    latitude: number | undefined,
    longitude: number | undefined,
    userId?: string,
  ): Promise<IForecastResponse> {
    const cacheKey = `weather_forecast_${latitude?.toFixed(2)}_${longitude?.toFixed(2)}`;
    const cachedForecast =
      await this.cacheManager.get<IForecastResponse>(cacheKey);
    if (cachedForecast) {
      Logger.debug(`Returning cached forecast for ${latitude}, ${longitude}`);
      return cachedForecast;
    }

    const forecast = await this.client.getForecast(latitude, longitude);

    if (forecast && userId) {
      void this.userService.trackWeatherRequest(userId);
    }

    // 30 minutes TTL (1800000 ms)
    await this.cacheManager.set(cacheKey, forecast, 1800000);

    return forecast;
  }
}
