import { createHash } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Trigger, TriggerDocument } from './schemas/trigger.schema';
import { CreateTriggerDto } from './dto/create-trigger.dto';
import { UpdateTriggerDto } from './dto/update-trigger.dto';
import { ITrigger } from './interfaces/trigger.interface';
import { EncryptionService } from '../auth/encryption/encryption.service';

@Injectable()
export class TriggersService {
  constructor(
    @InjectModel(Trigger.name) private triggerModel: Model<TriggerDocument>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(
    createTriggerDto: CreateTriggerDto,
    key: string,
  ): Promise<ITrigger> {
    const bufferKey = createHash('sha256').update(key).digest();
    const createdTrigger = new this.triggerModel({
      ...createTriggerDto,
      type: this.encryptionService.encryptSensitiveData(
        createTriggerDto.type,
        bufferKey,
      ),
      note: this.encryptionService.encryptSensitiveData(
        createTriggerDto.note || '',
        bufferKey,
      ),
      datetimeAt: this.encryptionService.encryptSensitiveData(
        createTriggerDto.datetimeAt,
        bufferKey,
      ),
    });

    const savedTrigger = await createdTrigger.save();
    return this.mapToITrigger(savedTrigger, key);
  }

  async findAll(key: string, userId: string): Promise<ITrigger[]> {
    const triggers = await this.triggerModel.find({ userId }).exec();
    return triggers
      .map((trigger) => this.mapToITrigger(trigger, key))
      .filter((item) => !!item);
  }

  async findOne(id: string, key: string, userId: string): Promise<ITrigger> {
    const trigger = await this.triggerModel.findById(id).exec();
    if (!trigger) {
      throw new NotFoundException(`Trigger with ID "${id}" not found`);
    }

    if (trigger.userId !== userId) {
      throw new ForbiddenException(`Access denied to trigger "${id}"`);
    }

    return this.mapToITrigger(trigger, key);
  }

  async update(
    id: string,
    updateTriggerDto: UpdateTriggerDto,
    key: string,
    userId: string,
  ): Promise<ITrigger> {
    const trigger = await this.triggerModel.findById(id).exec();
    if (!trigger) {
      throw new NotFoundException(`Trigger with ID "${id}" not found`);
    }

    if (trigger.userId !== userId) {
      throw new ForbiddenException(`Access denied to trigger "${id}"`);
    }

    const bufferKey = createHash('sha256').update(key).digest();
    const encryptedUpdate: Partial<Trigger> = {};

    if (updateTriggerDto.type !== undefined) {
      encryptedUpdate.type = this.encryptionService.encryptSensitiveData(
        updateTriggerDto.type,
        bufferKey,
      );
    }

    if (updateTriggerDto.note !== undefined) {
      encryptedUpdate.note = this.encryptionService.encryptSensitiveData(
        updateTriggerDto.note,
        bufferKey,
      );
    }

    if (updateTriggerDto.datetimeAt !== undefined) {
      encryptedUpdate.datetimeAt = this.encryptionService.encryptSensitiveData(
        new Date(updateTriggerDto.datetimeAt).toISOString(),
        bufferKey,
      );
    }

    const updatedTrigger = await this.triggerModel
      .findByIdAndUpdate(id, encryptedUpdate, { new: true })
      .exec();

    if (!updatedTrigger) {
      throw new NotFoundException(`Trigger with ID "${id}" not found`);
    }
    return this.mapToITrigger(updatedTrigger, key);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.triggerModel
      .deleteOne({ _id: id, userId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Trigger with ID "${id}" not found`);
    }
  }

  private mapToITrigger(triggerDoc: TriggerDocument, key: string): ITrigger {
    const bufferKey = createHash('sha256').update(key).digest();

    const decrypt = (value: unknown, type: string): string => {
      if (typeof value === 'string') {
        return this.encryptionService.decryptSensitiveData(value, bufferKey);
      }
      throw new Error(`Expected string got ${typeof value} for ${type}`);
    };

    return {
      id: (triggerDoc._id as Types.ObjectId).toString(),
      userId: triggerDoc.userId,
      type: decrypt(triggerDoc.type, 'type'),
      note: triggerDoc.note ? decrypt(triggerDoc.note, 'note') : undefined,
      createdAt: triggerDoc.createdAt,
      datetimeAt: new Date(decrypt(triggerDoc.datetimeAt, 'datetimeAt')),
    };
  }
}
