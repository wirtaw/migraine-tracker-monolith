import { createHash } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Medication, MedicationDocument } from './schemas/medication.schema';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { IMedication } from './interfaces/medication.interface';
import { EncryptionService } from '../auth/encryption/encryption.service';

@Injectable()
export class MedicationsService {
  constructor(
    @InjectModel(Medication.name)
    private medicationModel: Model<MedicationDocument>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(
    createMedicationDto: CreateMedicationDto,
    key: string,
  ): Promise<IMedication> {
    const bufferKey = createHash('sha256').update(key).digest();
    const createdMedication = new this.medicationModel({
      ...createMedicationDto,
      title: this.encryptionService.encryptSensitiveData(
        createMedicationDto.title,
        bufferKey,
      ),
      dosage: this.encryptionService.encryptSensitiveData(
        createMedicationDto.dosage,
        bufferKey,
      ),
      notes: createMedicationDto.notes
        ? this.encryptionService.encryptSensitiveData(
            createMedicationDto.notes,
            bufferKey,
          )
        : '',
      datetimeAt: this.encryptionService.encryptSensitiveData(
        createMedicationDto.datetimeAt,
        bufferKey,
      ),
    });

    const savedMedication = await createdMedication.save();
    return this.mapToIMedication(savedMedication, key);
  }

  async findAll(key: string, userId: string): Promise<IMedication[]> {
    const medications = await this.medicationModel.find({ userId }).exec();
    return medications
      .map((medication) => this.mapToIMedication(medication, key))
      .filter((item) => !!item);
  }

  async findOne(id: string, key: string, userId: string): Promise<IMedication> {
    const medication = await this.medicationModel.findById(id).exec();
    if (!medication) {
      throw new NotFoundException(`Medication with ID "${id}" not found`);
    }

    if (medication.userId !== userId) {
      throw new ForbiddenException(`Access denied to medication "${id}"`);
    }

    return this.mapToIMedication(medication, key);
  }

  async update(
    id: string,
    updateMedicationDto: UpdateMedicationDto,
    key: string,
    userId: string,
  ): Promise<IMedication> {
    const medication = await this.medicationModel.findById(id).exec();
    if (!medication) {
      throw new NotFoundException(`Medication with ID "${id}" not found`);
    }

    if (medication.userId !== userId) {
      throw new ForbiddenException(`Access denied to medication "${id}"`);
    }

    const bufferKey = createHash('sha256').update(key).digest();
    const encryptedUpdate: Partial<Medication> = {};

    if (updateMedicationDto.title !== undefined) {
      encryptedUpdate.title = this.encryptionService.encryptSensitiveData(
        updateMedicationDto.title,
        bufferKey,
      );
    }

    if (updateMedicationDto.dosage !== undefined) {
      encryptedUpdate.dosage = this.encryptionService.encryptSensitiveData(
        updateMedicationDto.dosage,
        bufferKey,
      );
    }

    if (
      updateMedicationDto.notes !== undefined &&
      updateMedicationDto.notes !== ''
    ) {
      encryptedUpdate.notes = this.encryptionService.encryptSensitiveData(
        updateMedicationDto.notes,
        bufferKey,
      );
    }

    if (updateMedicationDto.datetimeAt !== undefined) {
      encryptedUpdate.datetimeAt = this.encryptionService.encryptSensitiveData(
        new Date(updateMedicationDto.datetimeAt).toISOString(),
        bufferKey,
      );
    }

    const updatedMedication = await this.medicationModel
      .findByIdAndUpdate(id, encryptedUpdate, { new: true })
      .exec();

    if (!updatedMedication) {
      throw new NotFoundException(`Medication with ID "${id}" not found`);
    }
    return this.mapToIMedication(updatedMedication, key);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.medicationModel
      .deleteOne({ _id: id, userId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Medication with ID "${id}" not found`);
    }
  }

  private mapToIMedication(
    medicationDoc: MedicationDocument,
    key: string,
  ): IMedication {
    const bufferKey = createHash('sha256').update(key).digest();

    const decrypt = (value: unknown, type: string): string => {
      if (typeof value === 'string') {
        return this.encryptionService.decryptSensitiveData(value, bufferKey);
      }
      throw new Error(`Expected string got ${typeof value} for ${type}`);
    };

    return {
      id: (medicationDoc._id as Types.ObjectId).toString(),
      userId: medicationDoc.userId,
      title: decrypt(medicationDoc.title, 'title'),
      dosage: decrypt(medicationDoc.dosage, 'dosage'),
      notes: medicationDoc.notes
        ? decrypt(medicationDoc.notes, 'notes')
        : undefined,
      datetimeAt: new Date(decrypt(medicationDoc.datetimeAt, 'datetimeAt')),
      createdAt: medicationDoc.createdAt,
      updateAt: medicationDoc.updateAt,
    };
  }
}
