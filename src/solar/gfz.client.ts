import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GfzClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async getKpIndex() {
    const baseUrl = this.config.get<string>('integration.apis.gfz');
    const url = `${baseUrl}/kp-index/qp_nowcast.json`; // Example endpoint

    try {
      const response = await firstValueFrom(this.http.get(url));
      return response.data;
    } catch (error) {
      Logger.error('Error fetching GFZ data', error);
      return null;
    }
  }
}
