import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EncryptionService } from './encryption/encryption.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UserService } from '../users/users.service';
import { AuthGuard } from './auth.guard';
import { JwtService } from './jwt.service';
import { SymmetricKeyService } from './symmetric-key.service';
import { SupabaseService } from './supabase.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    HttpModule,
  ],
  controllers: [AuthController],
  providers: [
    SymmetricKeyService,
    AuthService,
    EncryptionService,
    UserService,
    JwtService,
    JwtStrategy,
    AuthGuard,
    SupabaseService,
    SupabaseAuthGuard,
  ],
  exports: [JwtService, AuthGuard],
})
export class AuthModule {}
