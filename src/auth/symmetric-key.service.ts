// src/auth/symmetric-key.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SymmetricKeyService {
  private defaultJwtEncryptionKey = 'default_jwt_encryption_key';
  private cachedKey: string | null = null;
  private lastFetched: number = 0;
  private ttl: number = 5 * 60 * 1000;

  constructor(private readonly httpService: HttpService) {}

  async getKey(): Promise<string> {
    const now = Date.now();
    if (this.cachedKey && now - this.lastFetched < this.ttl) {
      return this.cachedKey;
    }

    let jwtEncryptionKey: string;
    const workerUrl = process.env.CLOUDFLARE_WORKER_URL;

    if (!workerUrl) {
      console.warn(
        'CLOUDFLARE_WORKER_URL environment variable is not defined. Using default JWT key.',
      );
      this.cachedKey = this.defaultJwtEncryptionKey;
      this.lastFetched = now;
      return this.defaultJwtEncryptionKey;
    } else {
      try {
        const response: { data: { JWT_KEY: string } } = await firstValueFrom(
          this.httpService.get(workerUrl),
        );

        const { data } = response;
        jwtEncryptionKey = data.JWT_KEY;
      } catch (error) {
        console.error(
          'Error fetching JWT encryption key from Cloudflare Worker:',
          error,
        );
        this.cachedKey = this.defaultJwtEncryptionKey;
        this.lastFetched = now;
        return this.defaultJwtEncryptionKey;
      }
    }

    this.cachedKey = jwtEncryptionKey;
    this.lastFetched = now;
    return jwtEncryptionKey;
  }
}
