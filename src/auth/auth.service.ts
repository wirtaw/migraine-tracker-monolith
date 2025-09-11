// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import crypto from 'node:crypto';
import { SupabaseService } from './supabase/supabase.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { EncryptionService } from './encryption/encryption.service';
import { LoginDto } from './dto/login.dto';
import { ErrorExceptionLogging } from '../utils/error.exception';
import type {
  AuthRegisterResponse,
  AuthLoginResponse,
} from './interfaces/auth.user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly encryptionService: EncryptionService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async register(createAuthDto: CreateAuthDto): Promise<AuthRegisterResponse> {
    const { email, password, ...userData } = createAuthDto;

    try {
      const salt: string = crypto.randomBytes(16).toString('base64');

      const symmetricKey: Buffer =
        await this.encryptionService.deriveSymmetricKey(password, salt);

      const { data, error } = await this.supabaseService.client.auth.signUp({
        email,
        password,
      });

      if (error) {
        ErrorExceptionLogging(error, AuthService.name);
        throw new BadRequestException();
      }

      const supabaseUser = data.user;

      if (!supabaseUser) {
        throw new NotFoundException(`user fith email ${email}`);
      }

      const encryptedSymmetricKey =
        await this.encryptionService.encryptSymmetricKey(symmetricKey);

      const newUser = new this.userModel({
        ...userData,
        userId: crypto.randomUUID().toString(),
        email,
        supabaseId: supabaseUser.id,
        salt,
        encryptedSymmetricKey,
      });

      await newUser.save();

      const payload = { sub: newUser.userId };
      const token: string = this.jwtService.sign(payload);

      return {
        message: 'User successfully registered.',
        user: { userId: newUser.userId, email: supabaseUser?.email },
        token,
      };
    } catch (error) {
      ErrorExceptionLogging(error, AuthService.name);
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthLoginResponse> {
    const { email, password } = loginDto;

    const { data, error } =
      await this.supabaseService.client.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      ErrorExceptionLogging(error, AuthService.name);
      throw new UnauthorizedException('Invalid credentials.');
    }

    const supabaseUser = data.user;

    // You can fetch and decrypt user data from your Mongoose DB here
    //const userInDb = await this.userModel
    //  .findOne({ userId: supabaseUser.id })
    //  .exec();

    // Example of using the encryption service
    // const decryptedKey = await this.encryptionService.decrypt(
    //   userInDb.encryptedSymmetricKey,
    //   password,
    //   userInDb.salt,
    //   userInDb.iv,
    // );

    return {
      message: 'Successfully logged in.',
      access_token: data.session.access_token,
      user: supabaseUser,
    };
  }
}
