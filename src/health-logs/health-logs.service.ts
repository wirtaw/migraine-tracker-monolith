import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Weight,
  WeightDocument,
  Height,
  HeightDocument,
  BloodPressure,
  BloodPressureDocument,
  Sleep,
  SleepDocument,
} from './schemas/health-logs.schema';
import {
  CreateWeightDto,
  CreateHeightDto,
  CreateBloodPressureDto,
  CreateSleepDto,
} from './dto/create-health-logs.dto';
import {
  UpdateWeightDto,
  UpdateHeightDto,
  UpdateBloodPressureDto,
  UpdateSleepDto,
} from './dto/update-health-logs.dto';
import {
  IWeight,
  IHeight,
  IBloodPressure,
  ISleep,
} from './interfaces/health-logs.interface';

@Injectable()
export class HealthLogsService {
  constructor(
    @InjectModel(Weight.name) private weightModel: Model<WeightDocument>,
    @InjectModel(Height.name) private heightModel: Model<HeightDocument>,
    @InjectModel(BloodPressure.name)
    private bloodPressureModel: Model<BloodPressureDocument>,
    @InjectModel(Sleep.name) private sleepModel: Model<SleepDocument>,
  ) {}

  // Weight
  async createWeight(createWeightDto: CreateWeightDto): Promise<IWeight> {
    const createdWeight = new this.weightModel(createWeightDto);
    const savedWeight = await createdWeight.save();
    return this.mapToIWeight(savedWeight);
  }

  async findAllWeights(): Promise<IWeight[]> {
    const weights = await this.weightModel.find().exec();
    return weights
      .map((weight) => this.mapToIWeight(weight))
      .filter((item) => !!item);
  }

  async findOneWeight(id: string): Promise<IWeight> {
    const weight = await this.weightModel.findById(id).exec();
    if (!weight) {
      throw new NotFoundException(`Weight log with ID "${id}" not found`);
    }
    return this.mapToIWeight(weight);
  }

  async updateWeight(
    id: string,
    updateWeightDto: UpdateWeightDto,
  ): Promise<IWeight> {
    const updatedWeight = await this.weightModel
      .findByIdAndUpdate(id, updateWeightDto, { new: true })
      .exec();
    if (!updatedWeight) {
      throw new NotFoundException(`Weight log with ID "${id}" not found`);
    }
    return this.mapToIWeight(updatedWeight);
  }

  async removeWeight(id: string): Promise<void> {
    const result = await this.weightModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Weight log with ID "${id}" not found`);
    }
  }

  // Height
  async createHeight(createHeightDto: CreateHeightDto): Promise<IHeight> {
    const createdHeight = new this.heightModel(createHeightDto);
    const savedHeight = await createdHeight.save();
    return this.mapToIHeight(savedHeight);
  }

  async findAllHeights(): Promise<IHeight[]> {
    const heights = await this.heightModel.find().exec();
    return heights
      .map((height) => this.mapToIHeight(height))
      .filter((item) => !!item);
  }

  async findOneHeight(id: string): Promise<IHeight> {
    const height = await this.heightModel.findById(id).exec();
    if (!height) {
      throw new NotFoundException(`Height log with ID "${id}" not found`);
    }
    return this.mapToIHeight(height);
  }

  async updateHeight(
    id: string,
    updateHeightDto: UpdateHeightDto,
  ): Promise<IHeight> {
    const updatedHeight = await this.heightModel
      .findByIdAndUpdate(id, updateHeightDto, { new: true })
      .exec();
    if (!updatedHeight) {
      throw new NotFoundException(`Height log with ID "${id}" not found`);
    }
    return this.mapToIHeight(updatedHeight);
  }

  async removeHeight(id: string): Promise<void> {
    const result = await this.heightModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Height log with ID "${id}" not found`);
    }
  }

  // Blood Pressure
  async createBloodPressure(
    createBloodPressureDto: CreateBloodPressureDto,
  ): Promise<IBloodPressure> {
    const createdBloodPressure = new this.bloodPressureModel(
      createBloodPressureDto,
    );
    const savedBloodPressure = await createdBloodPressure.save();
    return this.mapToIBloodPressure(savedBloodPressure);
  }

  async findAllBloodPressures(): Promise<IBloodPressure[]> {
    const bloodPressures = await this.bloodPressureModel.find().exec();
    return bloodPressures
      .map((bp) => this.mapToIBloodPressure(bp))
      .filter((item) => !!item);
  }

  async findOneBloodPressure(id: string): Promise<IBloodPressure> {
    const bloodPressure = await this.bloodPressureModel.findById(id).exec();
    if (!bloodPressure) {
      throw new NotFoundException(
        `Blood Pressure log with ID "${id}" not found`,
      );
    }
    return this.mapToIBloodPressure(bloodPressure);
  }

  async updateBloodPressure(
    id: string,
    updateBloodPressureDto: UpdateBloodPressureDto,
  ): Promise<IBloodPressure> {
    const updatedBloodPressure = await this.bloodPressureModel
      .findByIdAndUpdate(id, updateBloodPressureDto, { new: true })
      .exec();
    if (!updatedBloodPressure) {
      throw new NotFoundException(
        `Blood Pressure log with ID "${id}" not found`,
      );
    }
    return this.mapToIBloodPressure(updatedBloodPressure);
  }

  async removeBloodPressure(id: string): Promise<void> {
    const result = await this.bloodPressureModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Blood Pressure log with ID "${id}" not found`,
      );
    }
  }

  // Sleep
  async createSleep(createSleepDto: CreateSleepDto): Promise<ISleep> {
    const createdSleep = new this.sleepModel(createSleepDto);
    const savedSleep = await createdSleep.save();
    return this.mapToISleep(savedSleep);
  }

  async findAllSleeps(): Promise<ISleep[]> {
    const sleeps = await this.sleepModel.find().exec();
    return sleeps
      .map((sleep) => this.mapToISleep(sleep))
      .filter((item) => !!item);
  }

  async findOneSleep(id: string): Promise<ISleep> {
    const sleep = await this.sleepModel.findById(id).exec();
    if (!sleep) {
      throw new NotFoundException(`Sleep log with ID "${id}" not found`);
    }
    return this.mapToISleep(sleep);
  }

  async updateSleep(
    id: string,
    updateSleepDto: UpdateSleepDto,
  ): Promise<ISleep> {
    const updatedSleep = await this.sleepModel
      .findByIdAndUpdate(id, updateSleepDto, { new: true })
      .exec();
    if (!updatedSleep) {
      throw new NotFoundException(`Sleep log with ID "${id}" not found`);
    }
    return this.mapToISleep(updatedSleep);
  }

  async removeSleep(id: string): Promise<void> {
    const result = await this.sleepModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Sleep log with ID "${id}" not found`);
    }
  }

  // Mappers
  private mapToIWeight(weightDoc: WeightDocument): IWeight {
    return {
      id:
        weightDoc && weightDoc?._id
          ? (weightDoc._id as Types.ObjectId).toString()
          : '',
      userId: weightDoc.userId,
      weight: weightDoc.weight,
      notes: weightDoc?.notes,
      datetimeAt: weightDoc.datetimeAt,
    };
  }

  private mapToIHeight(heightDoc: HeightDocument): IHeight {
    return {
      id:
        heightDoc && heightDoc?._id
          ? (heightDoc._id as Types.ObjectId).toString()
          : '',
      userId: heightDoc.userId,
      height: heightDoc.height,
      notes: heightDoc?.notes,
      datetimeAt: heightDoc.datetimeAt,
    };
  }

  private mapToIBloodPressure(
    bloodPressureDoc: BloodPressureDocument,
  ): IBloodPressure {
    return {
      id:
        bloodPressureDoc && bloodPressureDoc?._id
          ? (bloodPressureDoc._id as Types.ObjectId).toString()
          : '',
      userId: bloodPressureDoc.userId,
      systolic: bloodPressureDoc.systolic,
      diastolic: bloodPressureDoc.diastolic,
      notes: bloodPressureDoc?.notes,
      datetimeAt: bloodPressureDoc.datetimeAt,
    };
  }

  private mapToISleep(sleepDoc: SleepDocument): ISleep {
    return {
      id:
        sleepDoc && sleepDoc?._id
          ? (sleepDoc._id as Types.ObjectId).toString()
          : '',
      userId: sleepDoc.userId,
      rate: sleepDoc.rate,
      notes: sleepDoc?.notes,
      startedAt: sleepDoc.startedAt,
      datetimeAt: sleepDoc.datetimeAt,
    };
  }
}
