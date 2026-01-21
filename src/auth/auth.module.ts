import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EncryptionService } from './encryption/encryption.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UserService } from '../users/users.service';
import { SymmetricKeyService } from './symmetric-key/symmetric-key.service';
import { SupabaseService } from './supabase/supabase.service';
import { HttpModule } from '@nestjs/axios';
import { CustomJwtService } from './jwt.service';
import { RbacGuard } from './guard/rbac.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        signOptions: { expiresIn: '1h' },
      }),
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    HttpModule,
  ],
  controllers: [AuthController],
  providers: [
    SymmetricKeyService,
    EncryptionService,
    AuthService,
    UserService,
    SupabaseService,
    CustomJwtService,
    RbacGuard,
    { provide: APP_GUARD, useClass: RbacGuard },
  ],
  exports: [JwtModule, SupabaseService, EncryptionService, CustomJwtService],
})
export class AuthModule {}
