import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Location, LocationDocument } from './schemas/locations.schema';
import { CreateLocationDto } from './dto/create-locations.dto';
import { UpdateLocationDto } from './dto/update-locations.dto';
import { ILocationData } from './interfaces/locations.interface';

@Injectable()
export class LocationService {
  constructor(
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
  ) {}

  async create(createLocationDto: CreateLocationDto): Promise<ILocationData> {
    const createdLocation = new this.locationModel(createLocationDto);
    const savedLocation = await createdLocation.save();
    return this.mapToILocationData(savedLocation);
  }

  async findAll(): Promise<ILocationData[]> {
    const locations = await this.locationModel.find().exec();
    return locations
      .map((location) => this.mapToILocationData(location))
      .filter((item) => !!item);
  }

  async findOne(id: string): Promise<ILocationData> {
    const location = await this.locationModel.findById(id).exec();
    if (!location) {
      throw new NotFoundException(`Location with ID "${id}" not found`);
    }
    return this.mapToILocationData(location);
  }

  async update(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<ILocationData> {
    const updatedLocation = await this.locationModel
      .findByIdAndUpdate(id, updateLocationDto, { new: true })
      .exec();
    if (!updatedLocation) {
      throw new NotFoundException(`Location with ID "${id}" not found`);
    }
    return this.mapToILocationData(updatedLocation);
  }

  async remove(id: string): Promise<void> {
    const result = await this.locationModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Location with ID "${id}" not found`);
    }
  }

  private mapToILocationData(locationDoc: LocationDocument): ILocationData {
    return {
      id:
        locationDoc && locationDoc?._id
          ? (locationDoc._id as Types.ObjectId).toString()
          : '',
      userId: locationDoc.userId,
      latitude: locationDoc.latitude,
      longitude: locationDoc.longitude,
      forecast: locationDoc.forecast,
      solar: locationDoc.solar,
      solarRadiation: locationDoc.solarRadiation,
      datetimeAt: locationDoc.datetimeAt,
      incidentId: locationDoc.incidentId,
    };
  }
}
