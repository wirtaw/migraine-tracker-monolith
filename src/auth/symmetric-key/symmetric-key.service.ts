import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
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
  private ttl = 1 * 60 * 1000;

  constructor(private readonly httpService: HttpService) {}

  private async generateHmacSignature(
    timestamp: string,
    headerKey: string,
  ): Promise<string> {
    const keyBuffer = Uint8Array.from(
      headerKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(`${timestamp}:`);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);

    return Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
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
    const signature = await this.generateHmacSignature(timestamp, headerKey);

    try {
      const headers: Record<string, string> = {
        'X-Timestamp': timestamp,
        'X-Signature': signature,
        'Content-Type': 'application/json',
        'Strict-Transport-Security':
          'max-age=63072000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;",
        'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID || '',
        'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET || '',
      };

      const response = await firstValueFrom<AxiosResponse<IWorkerKeys>>(
        this.httpService.get(workerUrl, {
          headers,
        }),
      );
      if (
        !response?.data?.JWT_SYMMETRIC_KEY_ENCRYPTION_KEY ||
        !response?.data?.JWT_SECRET
      ) {
        Logger.warn(
          `Invalid response from worker ${JSON.stringify(response.data)}`,
        );
        throw new InternalServerErrorException('Invalid response from worker');
      }

      const jwtEncryptionKey = response.data.JWT_SYMMETRIC_KEY_ENCRYPTION_KEY;
      const jwtSecret = response.data.JWT_SECRET;
      this.cachedKey = response.data;
      this.lastFetched = now;

      if (keyName === 'JWT_SECRET') {
        //Logger.warn(`jwtSecret ${jwtSecret}`);
        return jwtSecret;
      }

      return jwtEncryptionKey;
    } catch (error) {
      Logger.warn(`CLOUDFLARE_WORKER_URL ${process.env.CLOUDFLARE_WORKER_URL}`);
      Logger.warn(
        `CLOUDFLARE_WORKER_HEADER_KEY ${process.env.CLOUDFLARE_WORKER_HEADER_KEY}`,
      );
      ErrorExceptionLogging(error, SymmetricKeyService.name);
      throw error;
    }
  }
}
