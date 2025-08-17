// src/auth/encryption/encryption.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits

  // Generates a new salt for key derivation
  generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  // Derives a symmetric key from a password and salt using PBKDF2
  private deriveKey(password: string, salt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        100000, // Number of iterations
        this.keyLength,
        'sha256',
        (err, derivedKey) => {
          if (err) reject(err);
          resolve(derivedKey);
        },
      );
    });
  }

  // Encrypts a message using a password
  async encrypt(
    message: string,
    passwordFromSupabase: string,
  ): Promise<{
    encryptedData: string;
    salt: string;
    iv: string;
  }> {
    const salt = this.generateSalt();
    const key = await this.deriveKey(passwordFromSupabase, salt);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encryptedData: encrypted,
      salt: salt,
      iv: iv.toString('hex'),
    };
  }

  // Decrypts a message using a password, salt, and IV
  async decrypt(
    encryptedData: string,
    passwordFromSupabase: string,
    salt: string,
    iv: string,
  ): Promise<string> {
    const key = await this.deriveKey(passwordFromSupabase, salt);
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(iv, 'hex'),
    );
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
