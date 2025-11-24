import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { IOpenMeteoData } from './interfaces/weather.interface';

@Injectable()
export class OpenMeteoClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async fetchForecast(lat: number, lon: number): Promise<IOpenMeteoData> {
    const baseUrl = this.config.get<string>('integration.apis.openMeteo');
    const url = `${baseUrl}/v1/forecast`;

    const response = await firstValueFrom(
      this.http.get(url, {
        params: {
          latitude: lat,
          longitude: lon,
          current_weather: true,
          hourly:
            'temperature_2m,relative_humidity_2m,pressure_msl,apparent_temperature,wind_speed_10m,cloud_cover',
        },
      }),
    );
    return response.data as IOpenMeteoData;
  }
}
