import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import crypto from 'node:crypto';
import { AxiosResponse } from 'axios';
import { ErrorExceptionLogging } from '../../utils/error.exception';

@Injectable()
export class SymmetricKeyService {
  private defaultJwtEncryptionKey = 'default_jwt_encryption_key';
  private cachedKey: string | null = null;
  private lastFetched = 0;
  private ttl = 5 * 60 * 1000;

  constructor(private readonly httpService: HttpService) {}

  private generateHmacSignature(
    body: string,
    timestamp: string,
    headerKey: string,
  ): string {
    const message = `${timestamp}:${body}`;
    const hmac = crypto.createHmac('sha256', Buffer.from(headerKey, 'hex'));
    hmac.update(message);
    return hmac.digest('hex');
  }

  //TODO add getJWTKey method
  async getKey(): Promise<string> {
    const now = Date.now();
    if (this.cachedKey && now - this.lastFetched < this.ttl) {
      return this.cachedKey;
    }

    const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
    const headerKey = process.env.CLOUDFLARE_WORKER_HEADER_KEY;

    if (!workerUrl || !headerKey) {
      this.cachedKey = this.defaultJwtEncryptionKey;
      this.lastFetched = now;
      return this.defaultJwtEncryptionKey;
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({});
    const signature = this.generateHmacSignature(body, timestamp, headerKey);

    try {
      const response = await firstValueFrom<
        AxiosResponse<{ JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: string }>
      >(
        this.httpService.get(workerUrl, {
          headers: {
            'X-Timestamp': timestamp,
            'X-Signature': signature,
            'Content-Type': 'application/json',
          },
        }),
      );

      const jwtEncryptionKey = response.data.JWT_SYMMETRIC_KEY_ENCRYPTION_KEY;
      this.cachedKey = jwtEncryptionKey;
      this.lastFetched = now;
      return jwtEncryptionKey;
    } catch (error) {
      ErrorExceptionLogging(error, SymmetricKeyService.name);
      this.cachedKey = this.defaultJwtEncryptionKey;
      this.lastFetched = now;
      return this.defaultJwtEncryptionKey;
    }
  }
}
