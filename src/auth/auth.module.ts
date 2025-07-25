import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EncryptionService } from './encryption/encryption.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, EncryptionService],
})
export class AuthModule {}
