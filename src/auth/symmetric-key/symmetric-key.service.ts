import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import crypto from 'node:crypto';
import { AxiosResponse } from 'axios';
import { ErrorExceptionLogging } from '../../utils/error.exception';

interface IWorkerKeys {
  JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: string;
  JWT_SECRET: string;
}

@Injectable()
export class SymmetricKeyService {
  private cachedKey: IWorkerKeys | null = null;
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

  async getKey(
    keyName: 'JWT_SYMMETRIC_KEY_ENCRYPTION_KEY' | 'JWT_SECRET',
  ): Promise<string> {
    const now = Date.now();
    if (
      this.cachedKey &&
      now - this.lastFetched < this.ttl &&
      keyName === 'JWT_SYMMETRIC_KEY_ENCRYPTION_KEY'
    ) {
      return this.cachedKey.JWT_SYMMETRIC_KEY_ENCRYPTION_KEY;
    } else if (
      this.cachedKey &&
      now - this.lastFetched < this.ttl &&
      keyName === 'JWT_SECRET'
    ) {
      return this.cachedKey.JWT_SECRET;
    }

    const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
    const headerKey = process.env.CLOUDFLARE_WORKER_HEADER_KEY;

    if (!workerUrl || !headerKey) {
      throw new InternalServerErrorException('Invalid workerUrl or headerKey');
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({});
    const signature = this.generateHmacSignature(body, timestamp, headerKey);

    try {
      const response = await firstValueFrom<AxiosResponse<IWorkerKeys>>(
        this.httpService.get(workerUrl, {
          headers: {
            'X-Timestamp': timestamp,
            'X-Signature': signature,
            'Content-Type': 'application/json',
          },
        }),
      );
      if (
        !response?.data?.JWT_SYMMETRIC_KEY_ENCRYPTION_KEY ||
        !response?.data?.JWT_SECRET
      ) {
        throw new InternalServerErrorException('Invalid resonse from worker');
      }

      const jwtEncryptionKey = response.data.JWT_SYMMETRIC_KEY_ENCRYPTION_KEY;
      const jwtSecret = response.data.JWT_SECRET;
      this.cachedKey = response.data;
      this.lastFetched = now;

      if (keyName === 'JWT_SECRET') {
        return jwtSecret;
      }

      return jwtEncryptionKey;
    } catch (error) {
      ErrorExceptionLogging(error, SymmetricKeyService.name);
      throw error;
    }
  }
}
