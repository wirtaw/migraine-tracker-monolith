// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import crypto, { createHash } from 'node:crypto';
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
import { IUser } from '../users/interfaces/user.interface';

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

      const bufferKey = createHash('sha256')
        .update(encryptedSymmetricKey)
        .digest();

      const newUser = new this.userModel({
        ...userData,
        userId: crypto.randomUUID().toString(),
        email: this.encryptionService.encryptSensitiveData(email, bufferKey),
        supabaseId: supabaseUser.id,
        salt,
        encryptedSymmetricKey,
        role: this.encryptionService.encryptSensitiveData(
          Role.GUEST,
          bufferKey,
        ),
        latitude: this.encryptionService.encryptSensitiveData(
          userData.latitude.toString(),
          bufferKey,
        ),
        longitude: this.encryptionService.encryptSensitiveData(
          userData.longitude.toString(),
          bufferKey,
        ),
        birthDate: this.encryptionService.encryptSensitiveData(
          userData.birthDate,
          bufferKey,
        ),
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

  async loginWithOAuth(accessToken: string): Promise<AuthResponse> {
    const {
      data: { user: supabaseUser },
      error,
    } = await this.supabaseService.getUser(accessToken);

    if (error || !supabaseUser) {
      ErrorExceptionLogging(
        error || new Error('User not found'),
        AuthService.name,
      );
      throw new UnauthorizedException('Invalid OAuth token.');
    }

    const email = supabaseUser.email;
    if (!email) {
      throw new BadRequestException(
        'OAuth provider did not return an email address.',
      );
    }

    //Logger.log(`ID: ${supabaseUser.id}, email: ${email}`);

    let userInDb = await this.userModel.findOne({
      supabaseId: supabaseUser.id,
      email,
    });

    if (!userInDb) {
      const generatedSecret = crypto.randomBytes(32).toString('hex');
      const salt: string = crypto.randomBytes(16).toString('base64');

      const symmetricKey: Buffer =
        await this.encryptionService.deriveSymmetricKey(generatedSecret, salt);

      const encryptedSymmetricKey =
        await this.encryptionService.encryptSymmetricKey(symmetricKey);

      const bufferKey = createHash('sha256')
        .update(encryptedSymmetricKey)
        .digest();

      const newUser = new this.userModel({
        userId: crypto.randomUUID().toString(),
        supabaseId: supabaseUser.id,
        email: this.encryptionService.encryptSensitiveData(email, bufferKey),
        longitude: this.encryptionService.encryptSensitiveData('0', bufferKey),
        latitude: this.encryptionService.encryptSensitiveData('0', bufferKey),
        birthDate: this.encryptionService.encryptSensitiveData(
          new Date().toISOString(),
          bufferKey,
        ),
        salt,
        encryptedSymmetricKey,
        role: this.encryptionService.encryptSensitiveData(Role.USER, bufferKey),
      });

      userInDb = await newUser.save();
    }

    if (!userInDb.encryptedSymmetricKey) {
      throw new UnauthorizedException('User encryption setup is incomplete.');
    }

    const role = userInDb.role || Role.USER;
    Logger.log(`auth role: '${role}'`);

    const payload: UserPayload = {
      userId: supabaseUser.id,
      email: email,
      role,
    };

    const token = await this.jwtService.signPayload(
      { ...payload, key: userInDb.encryptedSymmetricKey },
      '1 h',
    );

    return {
      message: 'Successfully logged in via OAuth.',
      user: payload,
      token,
    };
  }

  async getProfile(userId: string): Promise<Partial<IUser>> {
    const user = await this.userModel.findOne({ supabaseId: userId }).exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return this.mapToIUser(user, user.encryptedSymmetricKey);
  }

  private mapToIUser(userDoc: UserDocument, key: string): Partial<IUser> {
    const bufferKey = createHash('sha256').update(key).digest();

    const decrypt = (value: unknown, type: string): string => {
      if (typeof value === 'string') {
        return this.encryptionService.decryptSensitiveData(value, bufferKey);
      }
      throw new Error(`Expected string got ${typeof value} for ${type}`);
    };

    return {
      userId: userDoc.supabaseId,
      longitude: decrypt(userDoc.longitude, 'longitude'),
      latitude: decrypt(userDoc.latitude, 'latitude'),
      birthDate: decrypt(userDoc.birthDate, 'birthDate'),
      email: decrypt(userDoc.email, 'email'),
      emailNotifications: !!userDoc?.emailNotifications,
      dailySummary: !!userDoc?.dailySummary,
      personalHealthData: !!userDoc?.personalHealthData,
      securitySetup: !!userDoc?.securitySetup,
      profileFilled: !!userDoc?.profileFilled,
      fetchDataErrors: userDoc?.fetchDataErrors || undefined,
      fetchMagneticWeather: !!userDoc?.fetchMagneticWeather,
      fetchWeather: !!userDoc?.fetchWeather,
      role: decrypt(userDoc.role, 'role') as Role,
    };
  }
}
