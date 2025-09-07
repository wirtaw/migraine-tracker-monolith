import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import { SymmetricKeyService } from '../symmetric-key/symmetric-key.service';
import crypto from 'node:crypto';

describe('EncryptionService (integration)', () => {
  let service: EncryptionService;

  const mockMasterKey = 'MASTER_KEY_1234567890';
  const mockSymmetricKeyService = {
    getKey: jest.fn().mockResolvedValue(mockMasterKey),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: SymmetricKeyService,
          useValue: mockSymmetricKeyService,
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should derive symmetric key and encrypt it correctly', async () => {
    const password = 'StrongPass123!';
    const salt = crypto.randomBytes(16).toString('base64');

    const derivedKey = await service.deriveSymmetricKey(password, salt);
    expect(Buffer.isBuffer(derivedKey)).toBe(true);
    expect(derivedKey.length).toBe(32);

    const encrypted = await service.encryptSymmetricKey(derivedKey);
    expect(typeof encrypted).toBe('string');

    const [ivHex, cipherHex, authTagHex] = encrypted.split(':');
    expect(ivHex).toMatch(/^[a-f0-9]{32}$/);
    expect(cipherHex).toMatch(/^[a-f0-9]+$/);
    expect(authTagHex).toMatch(/^[a-f0-9]{32}$/);

    const iv = Buffer.from(ivHex, 'hex');
    const cipher = Buffer.from(cipherHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decrypted = await service.decryptSymmetricKey(encrypted);

    expect(decrypted.equals(derivedKey)).toBe(true);
    expect(iv.length).toBe(16);
    expect(authTag.length).toBe(16);
    expect(cipher.length).toBeGreaterThan(0);
  });
});
