import { createHash } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Symptom, SymptomDocument } from './schemas/symptom.schema';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { ISymptom } from './interfaces/symptom.interface';
import { EncryptionService } from '../auth/encryption/encryption.service';

@Injectable()
export class SymptomsService {
  constructor(
    @InjectModel(Symptom.name) private symptomModel: Model<SymptomDocument>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(
    createSymptomDto: CreateSymptomDto,
    key: string,
  ): Promise<ISymptom> {
    const bufferKey = createHash('sha256').update(key).digest();
    const createdSymptom = new this.symptomModel({
      ...createSymptomDto,
      type: this.encryptionService.encryptSensitiveData(
        createSymptomDto.type,
        bufferKey,
      ),
      severity: this.encryptionService.encryptSensitiveData(
        createSymptomDto.severity.toString(),
        bufferKey,
      ),
      note: createSymptomDto.note
        ? this.encryptionService.encryptSensitiveData(
            createSymptomDto.note,
            bufferKey,
          )
        : '',
      datetimeAt: this.encryptionService.encryptSensitiveData(
        createSymptomDto.datetimeAt,
        bufferKey,
      ),
    });

    const savedSymptom = await createdSymptom.save();
    return this.mapToISymptom(savedSymptom, key);
  }

  async findAll(key: string, userId: string): Promise<ISymptom[]> {
    const symptoms = await this.symptomModel.find({ userId }).exec();
    return symptoms
      .map((symptom) => this.mapToISymptom(symptom, key))
      .filter((item) => !!item);
  }

  async findOne(id: string, key: string, userId: string): Promise<ISymptom> {
    const symptom = await this.symptomModel.findById(id).exec();
    if (!symptom) {
      throw new NotFoundException(`Symptom with ID "${id}" not found`);
    }

    if (symptom.userId !== userId) {
      throw new ForbiddenException(`Access denied to symptom "${id}"`);
    }

    return this.mapToISymptom(symptom, key);
  }

  async update(
    id: string,
    updateSymptomDto: UpdateSymptomDto,
    key: string,
    userId: string,
  ): Promise<ISymptom> {
    const symptom = await this.symptomModel.findById(id).exec();
    if (!symptom) {
      throw new NotFoundException(`Symptom with ID "${id}" not found`);
    }

    if (symptom.userId !== userId) {
      throw new ForbiddenException(`Access denied to symptom "${id}"`);
    }

    const bufferKey = createHash('sha256').update(key).digest();
    const encryptedUpdate: Partial<Symptom> = {};

    if (updateSymptomDto.type !== undefined) {
      encryptedUpdate.type = this.encryptionService.encryptSensitiveData(
        updateSymptomDto.type,
        bufferKey,
      );
    }

    if (updateSymptomDto.severity !== undefined) {
      encryptedUpdate.severity = this.encryptionService.encryptSensitiveData(
        updateSymptomDto.severity.toString(),
        bufferKey,
      );
    }

    if (updateSymptomDto.note !== undefined && updateSymptomDto.note !== '') {
      encryptedUpdate.note = this.encryptionService.encryptSensitiveData(
        updateSymptomDto.note,
        bufferKey,
      );
    }

    if (updateSymptomDto.datetimeAt !== undefined) {
      encryptedUpdate.datetimeAt = this.encryptionService.encryptSensitiveData(
        new Date(updateSymptomDto.datetimeAt).toISOString(),
        bufferKey,
      );
    }

    const updatedSymptom = await this.symptomModel
      .findByIdAndUpdate(id, encryptedUpdate, { new: true })
      .exec();

    if (!updatedSymptom) {
      throw new NotFoundException(`Symptom with ID "${id}" not found`);
    }
    return this.mapToISymptom(updatedSymptom, key);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.symptomModel
      .deleteOne({ _id: id, userId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Symptom with ID "${id}" not found`);
    }
  }

  private mapToISymptom(symptomDoc: SymptomDocument, key: string): ISymptom {
    const bufferKey = createHash('sha256').update(key).digest();

    const decrypt = (value: unknown, type: string): string => {
      if (typeof value === 'string') {
        return this.encryptionService.decryptSensitiveData(value, bufferKey);
      }
      throw new Error(`Expected string got ${typeof value} for ${type}`);
    };

    return {
      id: (symptomDoc._id as Types.ObjectId).toString(),
      userId: symptomDoc.userId,
      type: decrypt(symptomDoc.type, 'type'),
      severity: parseInt(decrypt(symptomDoc.severity, 'severity'), 10),
      note: symptomDoc.note ? decrypt(symptomDoc.note, 'note') : undefined,
      createdAt: symptomDoc.createdAt,
      datetimeAt: new Date(decrypt(symptomDoc.datetimeAt, 'datetimeAt')),
    };
  }
}
