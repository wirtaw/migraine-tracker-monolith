import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { OpenMeteoClient } from './open-meteo.client';
import { IWeatherData } from './interfaces/weather.interface';

@Injectable()
export class WeatherService {
  constructor(
    private readonly client: OpenMeteoClient,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getForecast(lat: number, lon: number): Promise<IWeatherData> {
    const cacheKey = `weather_forecast_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = await this.cacheManager.get<IWeatherData>(cacheKey);
    if (cached) {
      return cached;
    }

    const rawData = await this.client.fetchForecast(lat, lon);
    const weatherData = this.transformOpenMeteoData(rawData);

    // 30 minutes TTL (1800000 ms)
    await this.cacheManager.set(cacheKey, weatherData, 1800000);

    return weatherData;
  }

  private transformOpenMeteoData(data: any): IWeatherData {
    const current = data.current_weather;
    const hourly = data.hourly;

    // Simple mapping logic - can be expanded based on requirements
    // OpenMeteo weather codes: https://open-meteo.com/en/docs
    const weatherCode = current.weathercode;
    const description = this.getWeatherDescription(weatherCode);
    const icon = this.getWeatherIcon(weatherCode);

    return {
      temperature: current.temperature,
      humidity: hourly?.relative_humidity_2m?.[0], // Approximation using first hourly data point
      pressure: hourly?.pressure_msl?.[0],
      feels_like: hourly?.apparent_temperature?.[0],
      wind_speed_10m: current.windspeed,
      clouds: hourly?.cloud_cover?.[0],
      uvi: 0, // OpenMeteo free API doesn't provide UV in basic forecast, placeholder
      description,
      icon,
      alerts: [], // OpenMeteo doesn't provide alerts in free tier easily
    };
  }

  private getWeatherDescription(code: number): string {
    const codes: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
    };
    return codes[code] || 'Unknown';
  }

  private getWeatherIcon(code: number): string {
    // Map codes to icon names (e.g., for a frontend icon set)
    // This is a placeholder mapping
    if (code === 0) return 'clear-day';
    if (code >= 1 && code <= 3) return 'partly-cloudy-day';
    if (code >= 45 && code <= 48) return 'fog';
    if (code >= 51 && code <= 67) return 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'rain';
    if (code >= 95) return 'thunderstorm';
    return 'clear-day';
  }
}
