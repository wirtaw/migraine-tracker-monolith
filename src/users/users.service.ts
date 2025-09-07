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
    const createdUser = new this.userModel(createUserDto);

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
      supabaseId: userDoc.supabaseId,
      longitude: userDoc.longitude,
      latitude: userDoc.latitude,
      birthDate: userDoc.birthDate,
      email: userDoc.email,
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
    };
  }
}
