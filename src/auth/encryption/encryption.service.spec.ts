import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import { SymmetricKeyService } from '../symmetric-key/symmetric-key.service';
import crypto from 'node:crypto';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let module: TestingModule;

  const mockMasterKey = 'MASTER_KEY_1234567890';
  const mockSymmetricKeyService = {
    getKey: jest.fn().mockResolvedValue(mockMasterKey),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
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

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should derive symmetric key from password and salt', async () => {
    const password = 'testPassword';
    const salt = service.generateSalt();

    const key = await service.deriveSymmetricKey(password, salt);

    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it('should encrypt and decrypt sensitive data correctly', async () => {
    const password = 'testPassword';
    const salt = service.generateSalt();
    const symmetricKey = await service.deriveSymmetricKey(password, salt);

    const originalData = 'Sensitive migraine data';
    const encryptedPayload = service.encryptSensitiveData(
      originalData,
      symmetricKey,
    );

    const parts = encryptedPayload.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(32);
    expect(parts[1]).toBeTruthy();
    expect(parts[2]).toHaveLength(32);

    const decrypted = service.decryptSensitiveData(
      encryptedPayload,
      symmetricKey,
    );
    expect(decrypted).toBe(originalData);
  });

  it('should encrypt and decrypt symmetric key with master key', async () => {
    const symmetricKey = crypto.randomBytes(32);

    const encryptedKeyPayload = await service.encryptSymmetricKey(symmetricKey);
    const parts = encryptedKeyPayload.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(32);
    expect(parts[1]).toBeTruthy();
    expect(parts[2]).toHaveLength(32);

    const decryptedKey = await service.decryptSymmetricKey(encryptedKeyPayload);
    expect(decryptedKey.equals(symmetricKey)).toBe(true);
  });

  it('should throw error for invalid encrypted data format', () => {
    const symmetricKey = crypto.randomBytes(32);
    expect(() =>
      service.decryptSensitiveData('invalid-data', symmetricKey),
    ).toThrow('Invalid encrypted data format');
  });

  it('should throw error for invalid encrypted symmetric key format', async () => {
    await expect(service.decryptSymmetricKey('invalid-data')).rejects.toThrow(
      'Invalid encrypted symmetric key format',
    );
  });
});
