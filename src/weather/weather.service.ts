import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { OpenMeteoClient } from './open-meteo.client';
import { IWeatherData, IHourlyForecast } from './interfaces/weather.interface';
import { UserService } from '../users/users.service';

@Injectable()
export class WeatherService {
  constructor(
    private readonly client: OpenMeteoClient,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly userService: UserService,
  ) {}

  async getForecast(
    lat: number,
    lon: number,
    userId?: string,
  ): Promise<IWeatherData> {
    const cacheKey = `weather_forecast_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = await this.cacheManager.get<IWeatherData>(cacheKey);
    if (cached) {
      return cached;
    }

    const weatherData = await this.client.fetchForecast(lat, lon);

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

    if (weatherData) {
      // 30 days TTL (2592000000 ms) as data shouldn't change
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
  ): Promise<IHourlyForecast[]> {
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
}
