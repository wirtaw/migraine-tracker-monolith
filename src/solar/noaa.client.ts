import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NoaaClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async getSolarRadiation() {
    const baseUrl = this.config.get<string>('integration.apis.noaa');
    // Example endpoint for planetary K-index or solar wind
    const url = `${baseUrl}/products/noaa-planetary-k-index.json`;

    try {
      const response = await firstValueFrom(this.http.get(url));
      return response.data;
    } catch (error) {
      Logger.error('Error fetching NOAA data', error);
      return null;
    }
  }
}
