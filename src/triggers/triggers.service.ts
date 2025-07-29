import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Trigger, TriggerDocument } from './schemas/trigger.schema';
import { CreateTriggerDto } from './dto/create-trigger.dto';
import { UpdateTriggerDto } from './dto/update-trigger.dto';
import { ITrigger } from './interfaces/trigger.interface';

@Injectable()
export class TriggersService {
  constructor(
    @InjectModel(Trigger.name) private triggerModel: Model<TriggerDocument>,
  ) {}

  async create(createTriggerDto: CreateTriggerDto): Promise<ITrigger | null> {
    const createdTrigger = new this.triggerModel(createTriggerDto);
    const savedTrigger = await createdTrigger.save();
    return this.mapToITrigger(savedTrigger);
  }

  async findAll(): Promise<ITrigger[]> {
    const triggers = await this.triggerModel.find().exec();
    return triggers
      .map((trigger) => this.mapToITrigger(trigger))
      .filter((item) => !!item);
  }

  async findOne(id: string): Promise<ITrigger | null> {
    const trigger = await this.triggerModel.findById(id).exec();
    if (!trigger) {
      throw new NotFoundException(`Trigger with ID "${id}" not found`);
    }
    return this.mapToITrigger(trigger);
  }

  async update(
    id: string,
    updateTriggerDto: UpdateTriggerDto,
  ): Promise<ITrigger | null> {
    const updatedTrigger = await this.triggerModel
      .findByIdAndUpdate(id, updateTriggerDto, { new: true })
      .exec();
    if (!updatedTrigger) {
      throw new NotFoundException(`Trigger with ID "${id}" not found`);
    }
    return this.mapToITrigger(updatedTrigger);
  }

  async remove(id: string): Promise<void> {
    const result = await this.triggerModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Trigger with ID "${id}" not found`);
    }
  }

  private mapToITrigger(triggerDoc: TriggerDocument): ITrigger | null {
    if (!triggerDoc) {
      return null;
    }

    return {
      id:
        triggerDoc && triggerDoc?._id
          ? (triggerDoc._id as Types.ObjectId).toString() // Explicitly cast to Types.ObjectId
          : '',
      userId: triggerDoc.userId,
      type: triggerDoc.type,
      note: triggerDoc.note,
      createdAt: triggerDoc.createdAt,
      datetimeAt: triggerDoc.datetimeAt,
    };
  }
}
