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
import {
  Incident,
  IncidentDocument,
} from '../incidents/schemas/incident.schema';
import {
  Medication,
  MedicationDocument,
} from '../medications/schemas/medication.schema';
import { Symptom, SymptomDocument } from '../symptoms/schemas/symptom.schema';
import { Trigger, TriggerDocument } from '../triggers/schemas/trigger.schema';
import {
  Location,
  LocationDocument,
} from '../locations/schemas/locations.schema';
import {
  Weight,
  WeightDocument,
  Height,
  HeightDocument,
  BloodPressure,
  BloodPressureDocument,
  Sleep,
  SleepDocument,
} from '../health-logs/schemas/health-logs.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @InjectModel(Medication.name)
    private medicationModel: Model<MedicationDocument>,
    @InjectModel(Symptom.name) private symptomModel: Model<SymptomDocument>,
    @InjectModel(Trigger.name) private triggerModel: Model<TriggerDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    @InjectModel(Weight.name) private weightModel: Model<WeightDocument>,
    @InjectModel(Height.name) private heightModel: Model<HeightDocument>,
    @InjectModel(BloodPressure.name)
    private bloodPressureModel: Model<BloodPressureDocument>,
    @InjectModel(Sleep.name) private sleepModel: Model<SleepDocument>,
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
      birthDate: this.encryptionService.encryptSensitiveData(
        createUserDto.birthDate,
        bufferKey,
      ),
      email: this.encryptionService.encryptSensitiveData(
        createUserDto.email,
        bufferKey,
      ),
      role: this.encryptionService.encryptSensitiveData('guest', bufferKey),
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

  async trackWeatherRequest(userId: string): Promise<void> {
    await this.userModel
      .updateOne(
        { supabaseId: userId },
        {
          $inc: { 'statistics.weatherApiRequests': 1 },
          $set: { 'statistics.lastUpdated': new Date() },
        },
      )
      .exec();
  }

  async trackSolarRequest(userId: string): Promise<void> {
    await this.userModel
      .updateOne(
        { supabaseId: userId },
        {
          $inc: { 'statistics.solarApiRequests': 1 },
          $set: { 'statistics.lastUpdated': new Date() },
        },
      )
      .exec();
  }

  async getStatistics(userId: string): Promise<IUser['statistics']> {
    const user = await this.userModel.findOne({ supabaseId: userId }).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const dbUsage = await this.calculateDbUsage(userId);

    const updatedUser = await this.userModel
      .findOneAndUpdate(
        { supabaseId: userId },
        {
          $set: {
            'statistics.dbUsageBytes': dbUsage,
            'statistics.lastUpdated': new Date(),
          },
        },
        { new: true },
      )
      .exec();

    return updatedUser?.statistics;
  }

  private async calculateDbUsage(userId: string): Promise<number> {
    const models = [
      this.userModel,
      this.incidentModel,
      this.medicationModel,
      this.symptomModel,
      this.triggerModel,
      this.locationModel,
      this.weightModel,
      this.heightModel,
      this.bloodPressureModel,
      this.sleepModel,
    ];

    let totalSize = 0;

    for (const model of models) {
      const match =
        model === this.userModel ? { supabaseId: userId } : { userId };
      const result = (await model
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              size: { $sum: { $bsonSize: '$$ROOT' } },
            },
          },
        ])
        .exec()) as Array<{ size: number }>;

      if (result.length > 0) {
        totalSize += result[0].size;
      }
    }

    return totalSize;
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
      statistics: userDoc.statistics
        ? {
            dbUsageBytes: userDoc.statistics.dbUsageBytes,
            weatherApiRequests: userDoc.statistics.weatherApiRequests,
            solarApiRequests: userDoc.statistics.solarApiRequests,
            lastUpdated: userDoc.statistics.lastUpdated,
          }
        : undefined,
    };
  }
}
