import { createHash } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { EncryptionService } from '../auth/encryption/encryption.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(createUserDto: CreateUserDto, key: string): Promise<IUser> {
    const bufferKey = createHash('sha256').update(key).digest();
    const createdUser = new this.userModel({
      ...createUserDto,
      latitude: this.encryptionService.encryptSensitiveData(
        createUserDto.latitude.toString(),
        bufferKey,
      ),
      longitude: this.encryptionService.encryptSensitiveData(
        createUserDto.longitude.toString(),
        bufferKey,
      ),
    });

    const savedUser = await createdUser.save();
    return this.mapToIUser(savedUser, key);
  }

  async findAll(): Promise<IUser[]> {
    const users = await this.userModel.find().exec();
    return users
      .map((user) => this.mapToIUser(user, user.encryptedSymmetricKey))
      .filter((item) => !!item);
  }

  async findOne(userId: string): Promise<IUser> {
    const user = await this.userModel.findOne({ userId }).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    return this.mapToIUser(user, user.encryptedSymmetricKey);
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
    key: string,
  ): Promise<IUser> {
    const bufferKey = createHash('sha256').update(key).digest();
    const encryptedUpdate: Partial<User> = { ...updateUserDto };

    if (updateUserDto.latitude) {
      encryptedUpdate.latitude = this.encryptionService.encryptSensitiveData(
        updateUserDto.latitude.toString(),
        bufferKey,
      );
    }

    if (updateUserDto.longitude) {
      encryptedUpdate.longitude = this.encryptionService.encryptSensitiveData(
        updateUserDto.longitude.toString(),
        bufferKey,
      );
    }

    if (updateUserDto.birthDate) {
      encryptedUpdate.birthDate = this.encryptionService.encryptSensitiveData(
        updateUserDto.birthDate.toString(),
        bufferKey,
      );
    }

    if (updateUserDto.email) {
      encryptedUpdate.email = this.encryptionService.encryptSensitiveData(
        updateUserDto.email,
        bufferKey,
      );
    }

    if (updateUserDto.role) {
      encryptedUpdate.role = this.encryptionService.encryptSensitiveData(
        updateUserDto.role,
        bufferKey,
      );
    }

    const updatedUser = await this.userModel
      .findOneAndUpdate({ userId }, encryptedUpdate, { new: true })
      .exec();
    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    return this.mapToIUser(updatedUser, key);
  }

  async remove(userId: string): Promise<void> {
    const result = await this.userModel.deleteOne({ userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserProfileDto,
    key: string,
  ): Promise<IUser> {
    const bufferKey = createHash('sha256').update(key).digest();
    const encryptedUpdate: Partial<User> = { ...updateUserDto };

    if (updateUserDto.latitude) {
      encryptedUpdate.latitude = this.encryptionService.encryptSensitiveData(
        updateUserDto.latitude.toString(),
        bufferKey,
      );
    }

    if (updateUserDto.longitude) {
      encryptedUpdate.longitude = this.encryptionService.encryptSensitiveData(
        updateUserDto.longitude.toString(),
        bufferKey,
      );
    }

    if (updateUserDto.birthDate) {
      encryptedUpdate.birthDate = this.encryptionService.encryptSensitiveData(
        updateUserDto.birthDate.toString(),
        bufferKey,
      );
    }

    const updatedUser = await this.userModel
      .findOneAndUpdate({ supabaseId: userId }, encryptedUpdate, { new: true })
      .exec();
    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    return this.mapToIUser(updatedUser, key);
  }

  private mapToIUser(userDoc: UserDocument, key: string): IUser {
    const bufferKey = createHash('sha256').update(key).digest();

    const decrypt = (value: unknown, type: string): string => {
      if (typeof value === 'string') {
        return this.encryptionService.decryptSensitiveData(value, bufferKey);
      }
      throw new Error(`Expected string got ${typeof value} for ${type}`);
    };

    return {
      userId: userDoc.userId,
      supabaseId: userDoc.supabaseId,
      longitude: decrypt(userDoc.longitude, 'longitude'),
      latitude: decrypt(userDoc.latitude, 'latitude'),
      birthDate: decrypt(userDoc.birthDate, 'birthDate'),
      email: decrypt(userDoc.email, 'email'),
      emailNotifications: !!userDoc?.emailNotifications,
      dailySummary: !!userDoc?.dailySummary,
      personalHealthData: !!userDoc?.personalHealthData,
      securitySetup: !!userDoc?.securitySetup,
      profileFilled: !!userDoc?.profileFilled,
      salt: userDoc.salt,
      encryptedSymmetricKey: userDoc.encryptedSymmetricKey,
      fetchDataErrors: userDoc?.fetchDataErrors || undefined,
      fetchMagneticWeather: !!userDoc?.fetchMagneticWeather,
      fetchWeather: !!userDoc?.fetchWeather,
      role: decrypt(userDoc.role, 'role'),
    };
  }
}
