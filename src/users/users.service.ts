import * as crypto from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<IUser> {
    const { userPassphrase, ...rest } = createUserDto;

    // 1. Generate a unique salt
    const salt = crypto.randomBytes(16).toString('base64');

    // 2. Derive a symmetric key using PBKDF2
    const symmetricKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.pbkdf2(
        userPassphrase,
        salt,
        310000, // High iteration count
        32, // 32 bytes for AES-256
        'sha256',
        (err, derivedKey) => {
          if (err) reject(err);
          resolve(derivedKey);
        },
      );
    });

    // 3. Generate a unique IV
    const iv = crypto.randomBytes(12);

    // Placeholder: You MUST replace this with a securely loaded master key from environment variables.
    const masterKey = crypto.randomBytes(32); // 32 bytes for AES-256

    // 4. Encrypt the symmetric key with the master key using AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv, {});
    let encryptedSymmetricKey = cipher.update(symmetricKey);
    encryptedSymmetricKey = Buffer.concat([
      encryptedSymmetricKey,
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const createdUser = new this.userModel({
      ...rest,
      salt: salt,
      encryptedSymmetricKey: encryptedSymmetricKey.toString('base64'),
      iv: Buffer.concat([iv, authTag]).toString('base64'),
    });

    const savedUser = await createdUser.save();
    return this.mapToIUser(savedUser);
  }

  async findAll(): Promise<IUser[]> {
    const users = await this.userModel.find().exec();
    return users.map((user) => this.mapToIUser(user)).filter((item) => !!item);
  }

  async findOne(userId: string): Promise<IUser> {
    const user = await this.userModel.findOne({ userId }).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    return this.mapToIUser(user);
  }

  async update(userId: string, updateUserDto: UpdateUserDto): Promise<IUser> {
    const updatedUser = await this.userModel
      .findOneAndUpdate({ userId }, updateUserDto, { new: true })
      .exec();
    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    return this.mapToIUser(updatedUser);
  }

  async remove(userId: string): Promise<void> {
    const result = await this.userModel.deleteOne({ userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
  }

  private mapToIUser(userDoc: UserDocument): IUser {
    return {
      userId: userDoc.userId,
      longitude: userDoc.longitude,
      latitude: userDoc.latitude,
      birthDate: userDoc.birthDate,
      emailNotifications: userDoc.emailNotifications,
      dailySummary: userDoc.dailySummary,
      personalHealthData: userDoc.personalHealthData,
      securitySetup: userDoc.securitySetup,
      profileFilled: userDoc.profileFilled,
      salt: userDoc.salt,
      encryptedSymmetricKey: userDoc.encryptedSymmetricKey,
      iv: userDoc.iv,
      fetchDataErrors: userDoc.fetchDataErrors,
      fetchMagneticWeather: userDoc.fetchMagneticWeather,
      fetchWeather: userDoc.fetchWeather,
    };
  }
}
