import { createHash } from 'crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Location, LocationDocument } from './schemas/locations.schema';
import { CreateLocationDto } from './dto/create-locations.dto';
import { UpdateLocationDto } from './dto/update-locations.dto';
import { ILocation } from './interfaces/locations.interface';
import { EncryptionService } from '../auth/encryption/encryption.service';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(
    createLocationDto: CreateLocationDto,
    key: string,
  ): Promise<ILocation> {
    const bufferKey = createHash('sha256').update(key).digest();
    const createdLocation = new this.locationModel({
      ...createLocationDto,
      latitude: this.encryptionService.encryptSensitiveData(
        createLocationDto.latitude.toString(),
        bufferKey,
      ),
      longitude: this.encryptionService.encryptSensitiveData(
        createLocationDto.longitude.toString(),
        bufferKey,
      ),
      datetimeAt: this.encryptionService.encryptSensitiveData(
        createLocationDto.datetimeAt,
        bufferKey,
      ),
    });

    const savedLocation = await createdLocation.save();
    return this.mapToILocation(savedLocation, key);
  }

  async findAll(key: string, userId: string): Promise<ILocation[]> {
    const locations = await this.locationModel.find({ userId }).exec();
    return locations
      .map((location) => this.mapToILocation(location, key))
      .filter((item) => !!item);
  }

  async findOne(id: string, key: string, userId: string): Promise<ILocation> {
    const location = await this.locationModel.findById(id).exec();
    if (!location) {
      throw new NotFoundException(`Location with ID "${id}" not found`);
    }

    if (location.userId !== userId) {
      throw new ForbiddenException(`Access denied to location "${id}"`);
    }

    return this.mapToILocation(location, key);
  }

  async update(
    id: string,
    updateLocationDto: UpdateLocationDto,
    key: string,
    userId: string,
  ): Promise<ILocation> {
    const location = await this.locationModel.findById(id).exec();
    if (!location) {
      throw new NotFoundException(`Location with ID "${id}" not found`);
    }

    if (location.userId !== userId) {
      throw new ForbiddenException(`Access denied to location "${id}"`);
    }

    const bufferKey = createHash('sha256').update(key).digest();
    const encryptedUpdate: Partial<Location> = {
      incidentId: updateLocationDto.incidentId,
      solarRadiation: updateLocationDto.solarRadiation,
      solar: updateLocationDto.solar,
      forecast: updateLocationDto.forecast,
      userId: updateLocationDto.userId,
    };

    // Remove fields that shouldn't be in the spread if they are undefined or need transformation
    if (updateLocationDto.latitude !== undefined) {
      encryptedUpdate.latitude = this.encryptionService.encryptSensitiveData(
        updateLocationDto.latitude.toString(),
        bufferKey,
      );
    }

    if (updateLocationDto.longitude !== undefined) {
      encryptedUpdate.longitude = this.encryptionService.encryptSensitiveData(
        updateLocationDto.longitude.toString(),
        bufferKey,
      );
    }

    if (updateLocationDto.datetimeAt !== undefined) {
      encryptedUpdate.datetimeAt = this.encryptionService.encryptSensitiveData(
        new Date(updateLocationDto.datetimeAt).toISOString(),
        bufferKey,
      );
    }

    const updatedLocation = await this.locationModel
      .findByIdAndUpdate(id, encryptedUpdate, { new: true })
      .exec();

    if (!updatedLocation) {
      throw new NotFoundException(`Location with ID "${id}" not found`);
    }
    return this.mapToILocation(updatedLocation, key);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.locationModel
      .deleteOne({ _id: id, userId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Location with ID "${id}" not found`);
    }
  }

  private mapToILocation(
    locationDoc: LocationDocument,
    key: string,
  ): ILocation {
    const bufferKey = createHash('sha256').update(key).digest();

    const decrypt = (value: unknown, type: string): string => {
      if (typeof value === 'string') {
        return this.encryptionService.decryptSensitiveData(value, bufferKey);
      }
      throw new Error(`Expected string got ${typeof value} for ${type}`);
    };

    return {
      id: (locationDoc._id as Types.ObjectId).toString(),
      userId: locationDoc.userId,
      latitude: parseFloat(decrypt(locationDoc.latitude, 'latitude')),
      longitude: parseFloat(decrypt(locationDoc.longitude, 'longitude')),
      forecast: locationDoc.forecast,
      solar: locationDoc.solar,
      solarRadiation: locationDoc.solarRadiation,
      createdAt: locationDoc.createdAt,
      datetimeAt: new Date(decrypt(locationDoc.datetimeAt, 'datetimeAt')),
      incidentId: locationDoc.incidentId,
    };
  }
}
