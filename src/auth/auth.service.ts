// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import crypto from 'node:crypto';
import { SupabaseService } from './supabase/supabase.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { EncryptionService } from './encryption/encryption.service';
import { LoginDto } from './dto/login.dto';
import { ErrorExceptionLogging } from '../utils/error.exception';
import type {
  AuthResponse,
  ChangeRoleResponse,
  UserPayload,
} from './interfaces/auth.user.interface';
import { CustomJwtService } from './jwt.service';
import { Role } from './enums/roles.enum';
import { StringValue } from 'ms';
import { RoleDto } from './dto/role.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly encryptionService: EncryptionService,
    private readonly jwtService: CustomJwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async register(createAuthDto: CreateAuthDto): Promise<AuthResponse> {
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
        role: Role.GUEST,
      });

      await newUser.save();

      const payload: UserPayload = {
        userId: newUser.userId,
        email,
        role: Role.GUEST,
      };
      const token: string = await this.jwtService.signPayload(
        { ...payload, key: encryptedSymmetricKey },
        '6 h',
      );

      return {
        message: 'User successfully registered.',
        user: payload,
        token,
      };
    } catch (error) {
      ErrorExceptionLogging(error, AuthService.name);
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
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

    const session = data?.session;

    if (!session) {
      ErrorExceptionLogging(error, AuthService.name);
      throw new UnauthorizedException('Missing session object from Supabase.');
    }

    const expiresIn = session.expires_in as unknown as StringValue;
    const user = data?.user;
    const userInDb = await this.userModel.findOne({
      supabaseId: user.id,
    });

    if (!userInDb || !userInDb?.encryptedSymmetricKey) {
      ErrorExceptionLogging(error, AuthService.name);
      throw new UnauthorizedException('Missing user with id in the database.');
    }

    const role = (user.user_metadata?.role as Role) || Role.GUEST;

    const payload: UserPayload = {
      userId: user.id,
      email: user.email ?? '',
      role,
    };
    const token = await this.jwtService.signPayload(
      { ...payload, key: userInDb.encryptedSymmetricKey },
      expiresIn,
    );

    return {
      message: 'Successfully logged in.',
      user: payload,
      token,
    };
  }

  async grandRole(
    roleDto: RoleDto,
    userId: string,
  ): Promise<ChangeRoleResponse> {
    const { role } = roleDto;

    if (role === Role.ADMIN) {
      throw new BadRequestException(`Cant change role to the Admin`);
    }

    const updatedUser = await this.userModel
      .findOneAndUpdate({ userId }, { role }, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return {
      message: 'Done',
    };
  }
}
