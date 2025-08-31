// src/auth/encryption/encryption.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { SymmetricKeyService } from '../symmetric-key/symmetric-key.service';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly pbkdf2Algorithm = 'sha256';
  private readonly pbkdf2Iterations = 310000;
  private readonly ivLength = 16;

  constructor(private readonly symmetricKeyService: SymmetricKeyService) {}

  generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async deriveSymmetricKey(password: string, salt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        this.pbkdf2Iterations,
        this.keyLength,
        this.pbkdf2Algorithm,
        (err, derivedKey) => {
          if (err) reject(err);
          resolve(derivedKey);
        },
      );
    });
  }

  encryptSensitiveData(data: string, symmetricKey: Buffer): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, symmetricKey, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:encryptedData:authTag
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  }

  decryptSensitiveData(encryptedPayload: string, symmetricKey: Buffer): string {
    const [ivHex, encryptedData, authTagHex] = encryptedPayload.split(':');
    if (!ivHex || !encryptedData || !authTagHex) {
      throw new Error('Invalid encrypted data format');
    }

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      symmetricKey,
      Buffer.from(ivHex, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private async getMasterKey(): Promise<Buffer> {
    const masterKey = await this.symmetricKeyService.getKey();
    return Buffer.from(masterKey.padEnd(this.keyLength, '\0')).slice(
      0,
      this.keyLength,
    );
  }

  async encryptSymmetricKey(symmetricKey: Buffer): Promise<string> {
    const masterKey = await this.getMasterKey();
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, masterKey, iv);

    let encryptedKey = cipher.update(symmetricKey);
    encryptedKey = Buffer.concat([encryptedKey, cipher.final()]);

    const authTag = cipher.getAuthTag();

    // Format: iv:encryptedKey:authTag
    return `${iv.toString('hex')}:${encryptedKey.toString('hex')}:${authTag.toString('hex')}`;
  }

  async decryptSymmetricKey(encryptedPayload: string): Promise<Buffer> {
    const masterKey = await this.getMasterKey();
    const [ivHex, encryptedKeyHex, authTagHex] = encryptedPayload.split(':');

    if (!ivHex || !encryptedKeyHex || !authTagHex) {
      throw new Error('Invalid encrypted symmetric key format');
    }

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      masterKey,
      Buffer.from(ivHex, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decryptedKey = decipher.update(Buffer.from(encryptedKeyHex, 'hex'));
    decryptedKey = Buffer.concat([decryptedKey, decipher.final()]);

    return decryptedKey;
  }
}
