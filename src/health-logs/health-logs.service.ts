import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createHash } from 'crypto';
import {
  Weight,
  WeightDocument,
  Height,
  HeightDocument,
  BloodPressure,
  BloodPressureDocument,
  Sleep,
  SleepDocument,
  Water,
  WaterDocument,
} from './schemas/health-logs.schema';
import {
  CreateWeightDto,
  CreateHeightDto,
  CreateBloodPressureDto,
  CreateSleepDto,
  CreateWaterDto,
} from './dto/create-health-logs.dto';
import {
  UpdateWeightDto,
  UpdateHeightDto,
  UpdateBloodPressureDto,
  UpdateSleepDto,
  UpdateWaterDto,
} from './dto/update-health-logs.dto';
import {
  IWeight,
  IHeight,
  IBloodPressure,
  ISleep,
  IWater,
} from './interfaces/health-logs.interface';
import { EncryptionService } from '../auth/encryption/encryption.service';

@Injectable()
export class HealthLogsService {
  constructor(
    @InjectModel(Weight.name) private weightModel: Model<WeightDocument>,
    @InjectModel(Height.name) private heightModel: Model<HeightDocument>,
    @InjectModel(BloodPressure.name)
    private bloodPressureModel: Model<BloodPressureDocument>,
    @InjectModel(Sleep.name) private sleepModel: Model<SleepDocument>,
    @InjectModel(Water.name) private waterModel: Model<WaterDocument>,
    private readonly encryptionService: EncryptionService,
  ) {}

  private getKey(key: string): Buffer<ArrayBufferLike> {
    return createHash('sha256').update(key).digest();
  }

  // Weight
  async createWeight(
    createWeightDto: CreateWeightDto,
    key: string,
  ): Promise<IWeight> {
    const bufferKey = this.getKey(key);
    const createdWeight = new this.weightModel({
      ...createWeightDto,
      weight: this.encryptionService.encryptSensitiveData(
        createWeightDto.weight.toString(),
        bufferKey,
      ),
      notes: createWeightDto.notes
        ? this.encryptionService.encryptSensitiveData(
            createWeightDto.notes,
            bufferKey,
          )
        : '',
      datetimeAt: this.encryptionService.encryptSensitiveData(
        createWeightDto.datetimeAt,
        bufferKey,
      ),
    });
    const savedWeight = await createdWeight.save();
    return this.mapToIWeight(savedWeight, key);
  }

  async findAllWeights(key: string, userId: string): Promise<IWeight[]> {
    const weights = await this.weightModel.find({ userId }).exec();
    return weights
      .map((weight) => this.mapToIWeight(weight, key))
      .filter((item) => !!item);
  }

  async findOneWeight(
    id: string,
    key: string,
    userId: string,
  ): Promise<IWeight> {
    const weight = await this.weightModel.findById(id).exec();
    if (!weight) {
      throw new NotFoundException(`Weight log with ID "${id}" not found`);
    }
    if (weight.userId !== userId) {
      throw new ForbiddenException(`Access denied to weight log "${id}"`);
    }
    return this.mapToIWeight(weight, key);
  }

  async updateWeight(
    id: string,
    updateWeightDto: UpdateWeightDto,
    key: string,
    userId: string,
  ): Promise<IWeight> {
    const weight = await this.weightModel.findById(id).exec();
    if (!weight) {
      throw new NotFoundException(`Weight log with ID "${id}" not found`);
    }
    if (weight.userId !== userId) {
      throw new ForbiddenException(`Access denied to weight log "${id}"`);
    }

    const bufferKey = this.getKey(key);
    const encryptedUpdate: Partial<Weight> = {};

    if (updateWeightDto.weight !== undefined) {
      encryptedUpdate.weight = this.encryptionService.encryptSensitiveData(
        updateWeightDto.weight.toString(),
        bufferKey,
      );
    }
    if (updateWeightDto.notes !== undefined && updateWeightDto.notes !== '') {
      encryptedUpdate.notes = this.encryptionService.encryptSensitiveData(
        updateWeightDto.notes,
        bufferKey,
      );
    }
    if (updateWeightDto.datetimeAt !== undefined) {
      encryptedUpdate.datetimeAt = this.encryptionService.encryptSensitiveData(
        new Date(updateWeightDto.datetimeAt).toISOString(),
        bufferKey,
      );
    }

    const updatedWeight = await this.weightModel
      .findByIdAndUpdate(id, encryptedUpdate, { new: true })
      .exec();

    if (!updatedWeight) {
      throw new NotFoundException(`Weight log with ID "${id}" not found`);
    }
    return this.mapToIWeight(updatedWeight, key);
  }

  async removeWeight(id: string, userId: string): Promise<void> {
    const result = await this.weightModel.deleteOne({ _id: id, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Weight log with ID "${id}" not found`);
    }
  }

  // Height
  async createHeight(
    createHeightDto: CreateHeightDto,
    key: string,
  ): Promise<IHeight> {
    const bufferKey = this.getKey(key);
    const createdHeight = new this.heightModel({
      ...createHeightDto,
      height: this.encryptionService.encryptSensitiveData(
        createHeightDto.height.toString(),
        bufferKey,
      ),
      notes: createHeightDto.notes
        ? this.encryptionService.encryptSensitiveData(
            createHeightDto.notes,
            bufferKey,
          )
        : '',
      datetimeAt: this.encryptionService.encryptSensitiveData(
        createHeightDto.datetimeAt,
        bufferKey,
      ),
    });
    const savedHeight = await createdHeight.save();
    return this.mapToIHeight(savedHeight, key);
  }

  async findAllHeights(key: string, userId: string): Promise<IHeight[]> {
    const heights = await this.heightModel.find({ userId }).exec();
    return heights
      .map((height) => this.mapToIHeight(height, key))
      .filter((item) => !!item);
  }

  async findOneHeight(
    id: string,
    key: string,
    userId: string,
  ): Promise<IHeight> {
    const height = await this.heightModel.findById(id).exec();
    if (!height) {
      throw new NotFoundException(`Height log with ID "${id}" not found`);
    }
    if (height.userId !== userId) {
      throw new ForbiddenException(`Access denied to height log "${id}"`);
    }
    return this.mapToIHeight(height, key);
  }

  async updateHeight(
    id: string,
    updateHeightDto: UpdateHeightDto,
    key: string,
    userId: string,
  ): Promise<IHeight> {
    const height = await this.heightModel.findById(id).exec();
    if (!height) {
      throw new NotFoundException(`Height log with ID "${id}" not found`);
    }
    if (height.userId !== userId) {
      throw new ForbiddenException(`Access denied to height log "${id}"`);
    }

    const bufferKey = this.getKey(key);
    const encryptedUpdate: Partial<Height> = {};

    if (updateHeightDto.height !== undefined) {
      encryptedUpdate.height = this.encryptionService.encryptSensitiveData(
        updateHeightDto.height.toString(),
        bufferKey,
      );
    }
    if (updateHeightDto.notes !== undefined && updateHeightDto.notes !== '') {
      encryptedUpdate.notes = this.encryptionService.encryptSensitiveData(
        updateHeightDto.notes,
        bufferKey,
      );
    }
    if (updateHeightDto.datetimeAt !== undefined) {
      encryptedUpdate.datetimeAt = this.encryptionService.encryptSensitiveData(
        new Date(updateHeightDto.datetimeAt).toISOString(),
        bufferKey,
      );
    }

    const updatedHeight = await this.heightModel
      .findByIdAndUpdate(id, encryptedUpdate, { new: true })
      .exec();

    if (!updatedHeight) {
      throw new NotFoundException(`Height log with ID "${id}" not found`);
    }
    return this.mapToIHeight(updatedHeight, key);
  }

  async removeHeight(id: string, userId: string): Promise<void> {
    const result = await this.heightModel.deleteOne({ _id: id, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Height log with ID "${id}" not found`);
    }
  }

  // Blood Pressure
  async createBloodPressure(
    createBloodPressureDto: CreateBloodPressureDto,
    key: string,
  ): Promise<IBloodPressure> {
    const bufferKey = this.getKey(key);
    const createdBloodPressure = new this.bloodPressureModel({
      ...createBloodPressureDto,
      systolic: this.encryptionService.encryptSensitiveData(
        createBloodPressureDto.systolic.toString(),
        bufferKey,
      ),
      diastolic: this.encryptionService.encryptSensitiveData(
        createBloodPressureDto.diastolic.toString(),
        bufferKey,
      ),
      notes: createBloodPressureDto.notes
        ? this.encryptionService.encryptSensitiveData(
            createBloodPressureDto.notes,
            bufferKey,
          )
        : '',
      datetimeAt: this.encryptionService.encryptSensitiveData(
        createBloodPressureDto.datetimeAt,
        bufferKey,
      ),
    });
    const savedBloodPressure = await createdBloodPressure.save();
    return this.mapToIBloodPressure(savedBloodPressure, key);
  }

  async findAllBloodPressures(
    key: string,
    userId: string,
  ): Promise<IBloodPressure[]> {
    const bloodPressures = await this.bloodPressureModel
      .find({ userId })
      .exec();
    return bloodPressures
      .map((bp) => this.mapToIBloodPressure(bp, key))
      .filter((item) => !!item);
  }

  async findOneBloodPressure(
    id: string,
    key: string,
    userId: string,
  ): Promise<IBloodPressure> {
    const bloodPressure = await this.bloodPressureModel.findById(id).exec();
    if (!bloodPressure) {
      throw new NotFoundException(
        `Blood Pressure log with ID "${id}" not found`,
      );
    }
    if (bloodPressure.userId !== userId) {
      throw new ForbiddenException(
        `Access denied to blood pressure log "${id}"`,
      );
    }
    return this.mapToIBloodPressure(bloodPressure, key);
  }

  async updateBloodPressure(
    id: string,
    updateBloodPressureDto: UpdateBloodPressureDto,
    key: string,
    userId: string,
  ): Promise<IBloodPressure> {
    const bloodPressure = await this.bloodPressureModel.findById(id).exec();
    if (!bloodPressure) {
      throw new NotFoundException(
        `Blood Pressure log with ID "${id}" not found`,
      );
    }
    if (bloodPressure.userId !== userId) {
      throw new ForbiddenException(
        `Access denied to blood pressure log "${id}"`,
      );
    }

    const bufferKey = this.getKey(key);
    const encryptedUpdate: Partial<BloodPressure> = {};

    if (updateBloodPressureDto.systolic !== undefined) {
      encryptedUpdate.systolic = this.encryptionService.encryptSensitiveData(
        updateBloodPressureDto.systolic.toString(),
        bufferKey,
      );
    }
    if (updateBloodPressureDto.diastolic !== undefined) {
      encryptedUpdate.diastolic = this.encryptionService.encryptSensitiveData(
        updateBloodPressureDto.diastolic.toString(),
        bufferKey,
      );
    }
    if (
      updateBloodPressureDto.notes !== undefined &&
      updateBloodPressureDto.notes !== ''
    ) {
      encryptedUpdate.notes = this.encryptionService.encryptSensitiveData(
        updateBloodPressureDto.notes,
        bufferKey,
      );
    }
    if (updateBloodPressureDto.datetimeAt !== undefined) {
      encryptedUpdate.datetimeAt = this.encryptionService.encryptSensitiveData(
        new Date(updateBloodPressureDto.datetimeAt).toISOString(),
        bufferKey,
      );
    }

    const updatedBloodPressure = await this.bloodPressureModel
      .findByIdAndUpdate(id, encryptedUpdate, { new: true })
      .exec();

    if (!updatedBloodPressure) {
      throw new NotFoundException(
        `Blood Pressure log with ID "${id}" not found`,
      );
    }
    return this.mapToIBloodPressure(updatedBloodPressure, key);
  }

  async removeBloodPressure(id: string, userId: string): Promise<void> {
    const result = await this.bloodPressureModel
      .deleteOne({ _id: id, userId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Blood Pressure log with ID "${id}" not found`,
      );
    }
  }

  // Sleep
  async createSleep(
    createSleepDto: CreateSleepDto,
    key: string,
  ): Promise<ISleep> {
    const bufferKey = this.getKey(key);
    const createdSleep = new this.sleepModel({
      ...createSleepDto,
      rate:
        createSleepDto.rate !== undefined
          ? this.encryptionService.encryptSensitiveData(
              createSleepDto.rate.toString(),
              bufferKey,
            )
          : undefined,
      minutesTotal:
        createSleepDto.minutesTotal !== undefined
          ? this.encryptionService.encryptSensitiveData(
              createSleepDto.minutesTotal.toString(),
              bufferKey,
            )
          : undefined,
      minutesDeep:
        createSleepDto.minutesDeep !== undefined
          ? this.encryptionService.encryptSensitiveData(
              createSleepDto.minutesDeep.toString(),
              bufferKey,
            )
          : undefined,
      minutesRem:
        createSleepDto.minutesRem !== undefined
          ? this.encryptionService.encryptSensitiveData(
              createSleepDto.minutesRem.toString(),
              bufferKey,
            )
          : undefined,
      timesWakeUp:
        createSleepDto.timesWakeUp !== undefined
          ? this.encryptionService.encryptSensitiveData(
              createSleepDto.timesWakeUp.toString(),
              bufferKey,
            )
          : undefined,
      notes: createSleepDto.notes
        ? this.encryptionService.encryptSensitiveData(
            createSleepDto.notes,
            bufferKey,
          )
        : '',
      startedAt: createSleepDto.startedAt
        ? this.encryptionService.encryptSensitiveData(
            createSleepDto.startedAt,
            bufferKey,
          )
        : undefined,
      datetimeAt: this.encryptionService.encryptSensitiveData(
        createSleepDto.datetimeAt,
        bufferKey,
      ),
    });
    const savedSleep = await createdSleep.save();
    return this.mapToISleep(savedSleep, key);
  }

  async findAllSleeps(key: string, userId: string): Promise<ISleep[]> {
    const sleeps = await this.sleepModel.find({ userId }).exec();
    return sleeps
      .map((sleep) => this.mapToISleep(sleep, key))
      .filter((item) => !!item);
  }

  async findOneSleep(id: string, key: string, userId: string): Promise<ISleep> {
    const sleep = await this.sleepModel.findById(id).exec();
    if (!sleep) {
      throw new NotFoundException(`Sleep log with ID "${id}" not found`);
    }
    if (sleep.userId !== userId) {
      throw new ForbiddenException(`Access denied to sleep log "${id}"`);
    }
    return this.mapToISleep(sleep, key);
  }

  async updateSleep(
    id: string,
    updateSleepDto: UpdateSleepDto,
    key: string,
    userId: string,
  ): Promise<ISleep> {
    const sleep = await this.sleepModel.findById(id).exec();
    if (!sleep) {
      throw new NotFoundException(`Sleep log with ID "${id}" not found`);
    }
    if (sleep.userId !== userId) {
      throw new ForbiddenException(`Access denied to sleep log "${id}"`);
    }

    const bufferKey = this.getKey(key);
    const encryptedUpdate: Partial<Sleep> = {};

    if (updateSleepDto.rate !== undefined) {
      encryptedUpdate.rate = this.encryptionService.encryptSensitiveData(
        updateSleepDto.rate.toString(),
        bufferKey,
      );
    }
    if (updateSleepDto.minutesTotal !== undefined) {
      encryptedUpdate.minutesTotal =
        this.encryptionService.encryptSensitiveData(
          updateSleepDto.minutesTotal.toString(),
          bufferKey,
        );
    }
    if (updateSleepDto.minutesDeep !== undefined) {
      encryptedUpdate.minutesDeep = this.encryptionService.encryptSensitiveData(
        updateSleepDto.minutesDeep.toString(),
        bufferKey,
      );
    }
    if (updateSleepDto.minutesRem !== undefined) {
      encryptedUpdate.minutesRem = this.encryptionService.encryptSensitiveData(
        updateSleepDto.minutesRem.toString(),
        bufferKey,
      );
    }
    if (updateSleepDto.timesWakeUp !== undefined) {
      encryptedUpdate.timesWakeUp = this.encryptionService.encryptSensitiveData(
        updateSleepDto.timesWakeUp.toString(),
        bufferKey,
      );
    }
    if (updateSleepDto.notes !== undefined && updateSleepDto.notes !== '') {
      encryptedUpdate.notes = this.encryptionService.encryptSensitiveData(
        updateSleepDto.notes,
        bufferKey,
      );
    }
    if (updateSleepDto.startedAt !== undefined) {
      encryptedUpdate.startedAt = this.encryptionService.encryptSensitiveData(
        new Date(updateSleepDto.startedAt).toISOString(),
        bufferKey,
      );
    }
    if (updateSleepDto.datetimeAt !== undefined) {
      encryptedUpdate.datetimeAt = this.encryptionService.encryptSensitiveData(
        new Date(updateSleepDto.datetimeAt).toISOString(),
        bufferKey,
      );
    }

    const updatedSleep = await this.sleepModel
      .findByIdAndUpdate(id, encryptedUpdate, { new: true })
      .exec();

    if (!updatedSleep) {
      throw new NotFoundException(`Sleep log with ID "${id}" not found`);
    }
    return this.mapToISleep(updatedSleep, key);
  }

  async removeSleep(id: string, userId: string): Promise<void> {
    const result = await this.sleepModel.deleteOne({ _id: id, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Sleep log with ID "${id}" not found`);
    }
  }

  // Water
  async createWater(
    createWaterDto: CreateWaterDto,
    key: string,
  ): Promise<IWater> {
    const bufferKey = this.getKey(key);
    const createdWater = new this.waterModel({
      ...createWaterDto,
      ml: this.encryptionService.encryptSensitiveData(
        createWaterDto.ml.toString(),
        bufferKey,
      ),
      notes: createWaterDto.notes
        ? this.encryptionService.encryptSensitiveData(
            createWaterDto.notes,
            bufferKey,
          )
        : '',
      datetimeAt: this.encryptionService.encryptSensitiveData(
        createWaterDto.datetimeAt,
        bufferKey,
      ),
    });
    const savedWater = await createdWater.save();
    return this.mapToIWater(savedWater, key);
  }

  async findAllWaters(key: string, userId: string): Promise<IWater[]> {
    const waters = await this.waterModel.find({ userId }).exec();
    return waters
      .map((water) => this.mapToIWater(water, key))
      .filter((item) => !!item);
  }

  async findOneWater(id: string, key: string, userId: string): Promise<IWater> {
    const water = await this.waterModel.findById(id).exec();
    if (!water) {
      throw new NotFoundException(`Water log with ID "${id}" not found`);
    }
    if (water.userId !== userId) {
      throw new ForbiddenException(`Access denied to water log "${id}"`);
    }
    return this.mapToIWater(water, key);
  }

  async updateWater(
    id: string,
    updateWaterDto: UpdateWaterDto,
    key: string,
    userId: string,
  ): Promise<IWater> {
    const water = await this.waterModel.findById(id).exec();
    if (!water) {
      throw new NotFoundException(`Water log with ID "${id}" not found`);
    }
    if (water.userId !== userId) {
      throw new ForbiddenException(`Access denied to water log "${id}"`);
    }

    const bufferKey = this.getKey(key);
    const encryptedUpdate: Partial<Water> = {};

    if (updateWaterDto.ml !== undefined) {
      encryptedUpdate.ml = this.encryptionService.encryptSensitiveData(
        updateWaterDto.ml.toString(),
        bufferKey,
      );
    }
    if (updateWaterDto.notes !== undefined && updateWaterDto.notes !== '') {
      encryptedUpdate.notes = this.encryptionService.encryptSensitiveData(
        updateWaterDto.notes,
        bufferKey,
      );
    }
    if (updateWaterDto.datetimeAt !== undefined) {
      encryptedUpdate.datetimeAt = this.encryptionService.encryptSensitiveData(
        new Date(updateWaterDto.datetimeAt).toISOString(),
        bufferKey,
      );
    }

    const updatedWater = await this.waterModel
      .findByIdAndUpdate(id, encryptedUpdate, { new: true })
      .exec();

    if (!updatedWater) {
      throw new NotFoundException(`Water log with ID "${id}" not found`);
    }
    return this.mapToIWater(updatedWater, key);
  }

  async removeWater(id: string, userId: string): Promise<void> {
    const result = await this.waterModel.deleteOne({ _id: id, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Water log with ID "${id}" not found`);
    }
  }

  // Mappers
  private mapToIWeight(weightDoc: WeightDocument, key: string): IWeight {
    const bufferKey = this.getKey(key);
    return {
      id: (weightDoc._id as Types.ObjectId).toString(),
      userId: weightDoc.userId,
      weight: parseFloat(
        this.encryptionService.decryptSensitiveData(
          weightDoc.weight,
          bufferKey,
        ),
      ),
      notes: weightDoc.notes
        ? this.encryptionService.decryptSensitiveData(
            weightDoc.notes,
            bufferKey,
          )
        : undefined,
      datetimeAt: new Date(
        this.encryptionService.decryptSensitiveData(
          weightDoc.datetimeAt,
          bufferKey,
        ),
      ),
    };
  }

  private mapToIHeight(heightDoc: HeightDocument, key: string): IHeight {
    const bufferKey = this.getKey(key);
    return {
      id: (heightDoc._id as Types.ObjectId).toString(),
      userId: heightDoc.userId,
      height: parseFloat(
        this.encryptionService.decryptSensitiveData(
          heightDoc.height,
          bufferKey,
        ),
      ),
      notes: heightDoc.notes
        ? this.encryptionService.decryptSensitiveData(
            heightDoc.notes,
            bufferKey,
          )
        : undefined,
      datetimeAt: new Date(
        this.encryptionService.decryptSensitiveData(
          heightDoc.datetimeAt,
          bufferKey,
        ),
      ),
    };
  }

  private mapToIBloodPressure(
    bloodPressureDoc: BloodPressureDocument,
    key: string,
  ): IBloodPressure {
    const bufferKey = this.getKey(key);
    return {
      id: (bloodPressureDoc._id as Types.ObjectId).toString(),
      userId: bloodPressureDoc.userId,
      systolic: parseFloat(
        this.encryptionService.decryptSensitiveData(
          bloodPressureDoc.systolic,
          bufferKey,
        ),
      ),
      diastolic: parseFloat(
        this.encryptionService.decryptSensitiveData(
          bloodPressureDoc.diastolic,
          bufferKey,
        ),
      ),
      notes: bloodPressureDoc.notes
        ? this.encryptionService.decryptSensitiveData(
            bloodPressureDoc.notes,
            bufferKey,
          )
        : undefined,
      datetimeAt: new Date(
        this.encryptionService.decryptSensitiveData(
          bloodPressureDoc.datetimeAt,
          bufferKey,
        ),
      ),
    };
  }

  private mapToISleep(sleepDoc: SleepDocument, key: string): ISleep {
    const bufferKey = this.getKey(key);
    return {
      id: (sleepDoc._id as Types.ObjectId).toString(),
      userId: sleepDoc.userId,
      rate: sleepDoc.rate
        ? parseInt(
            this.encryptionService.decryptSensitiveData(
              sleepDoc.rate,
              bufferKey,
            ),
            10,
          )
        : undefined,
      minutesTotal: sleepDoc.minutesTotal
        ? parseInt(
            this.encryptionService.decryptSensitiveData(
              sleepDoc.minutesTotal,
              bufferKey,
            ),
            10,
          )
        : undefined,
      minutesDeep: sleepDoc.minutesDeep
        ? parseInt(
            this.encryptionService.decryptSensitiveData(
              sleepDoc.minutesDeep,
              bufferKey,
            ),
            10,
          )
        : undefined,
      minutesRem: sleepDoc.minutesRem
        ? parseInt(
            this.encryptionService.decryptSensitiveData(
              sleepDoc.minutesRem,
              bufferKey,
            ),
            10,
          )
        : undefined,
      timesWakeUp: sleepDoc.timesWakeUp
        ? parseInt(
            this.encryptionService.decryptSensitiveData(
              sleepDoc.timesWakeUp,
              bufferKey,
            ),
            10,
          )
        : undefined,
      notes: sleepDoc.notes
        ? this.encryptionService.decryptSensitiveData(sleepDoc.notes, bufferKey)
        : undefined,
      startedAt: sleepDoc.startedAt
        ? new Date(
            this.encryptionService.decryptSensitiveData(
              sleepDoc.startedAt,
              bufferKey,
            ),
          )
        : undefined,
      datetimeAt: new Date(
        this.encryptionService.decryptSensitiveData(
          sleepDoc.datetimeAt,
          bufferKey,
        ),
      ),
    };
  }

  private mapToIWater(waterDoc: WaterDocument, key: string): IWater {
    const bufferKey = this.getKey(key);
    return {
      id: (waterDoc._id as Types.ObjectId).toString(),
      userId: waterDoc.userId,
      ml: parseInt(
        this.encryptionService.decryptSensitiveData(waterDoc.ml, bufferKey),
        10,
      ),
      notes: waterDoc.notes
        ? this.encryptionService.decryptSensitiveData(waterDoc.notes, bufferKey)
        : undefined,
      datetimeAt: new Date(
        this.encryptionService.decryptSensitiveData(
          waterDoc.datetimeAt,
          bufferKey,
        ),
      ),
    };
  }
}
