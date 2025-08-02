import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Symptom, SymptomDocument } from './schemas/symptom.schema';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { ISymptom } from './interfaces/symptom.interface';

@Injectable()
export class SymptomsService {
  constructor(
    @InjectModel(Symptom.name) private symptomModel: Model<SymptomDocument>,
  ) {}

  async create(createSymptomDto: CreateSymptomDto): Promise<ISymptom> {
    const createdSymptom = new this.symptomModel(createSymptomDto);
    const savedSymptom = await createdSymptom.save();
    return this.mapToISymptom(savedSymptom);
  }

  async findAll(): Promise<ISymptom[]> {
    const symptoms = await this.symptomModel.find().exec();
    return symptoms
      .map((symptom) => this.mapToISymptom(symptom))
      .filter((item) => !!item);
  }

  async findOne(id: string): Promise<ISymptom> {
    const symptom = await this.symptomModel.findById(id).exec();
    if (!symptom) {
      throw new NotFoundException(`Symptom with ID "${id}" not found`);
    }
    return this.mapToISymptom(symptom);
  }

  async update(
    id: string,
    updateSymptomDto: UpdateSymptomDto,
  ): Promise<ISymptom> {
    const updatedSymptom = await this.symptomModel
      .findByIdAndUpdate(id, updateSymptomDto, { new: true })
      .exec();
    if (!updatedSymptom) {
      throw new NotFoundException(`Symptom with ID "${id}" not found`);
    }
    return this.mapToISymptom(updatedSymptom);
  }

  async remove(id: string): Promise<void> {
    const result = await this.symptomModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Symptom with ID "${id}" not found`);
    }
  }

  private mapToISymptom(symptomDoc: SymptomDocument): ISymptom {
    return {
      id:
        symptomDoc && symptomDoc?._id
          ? (symptomDoc._id as Types.ObjectId).toString()
          : '',
      userId: symptomDoc.userId,
      type: symptomDoc.type,
      severity: symptomDoc.severity,
      note: symptomDoc.note,
      createdAt: symptomDoc.createdAt,
      datetimeAt: symptomDoc.datetimeAt,
    };
  }
}
