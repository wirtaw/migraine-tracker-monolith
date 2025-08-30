import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import { SymmetricKeyService } from '../symmetric-key/symmetric-key.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let symmetricKeyService: SymmetricKeyService;

  const mockSymmetricKeyService = {
    get: jest.fn(),
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
    symmetricKeyService = module.get<SymmetricKeyService>(SymmetricKeyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(symmetricKeyService).toBeDefined();
  });
});
