import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EncryptionService } from './encryption/encryption.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UserService } from '../users/users.service';
import { SymmetricKeyService } from './symmetric-key/symmetric-key.service';
import { SupabaseService } from './supabase/supabase.service';
import { HttpModule } from '@nestjs/axios';
import { CustomJwtService } from './jwt.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    HttpModule,
  ],
  controllers: [AuthController],
  providers: [
    SymmetricKeyService,
    EncryptionService,
    JwtService,
    AuthService,
    UserService,
    JwtStrategy,
    SupabaseService,
    CustomJwtService,
  ],
  exports: [JwtService],
})
export class AuthModule {}
