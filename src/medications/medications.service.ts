import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Medication, MedicationDocument } from './schemas/medication.schema';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { IMedication } from './interfaces/medication.interface';

@Injectable()
export class MedicationsService {
  constructor(
    @InjectModel(Medication.name)
    private medicationModel: Model<MedicationDocument>,
  ) {}

  async create(createMedicationDto: CreateMedicationDto): Promise<IMedication> {
    const createdMedication = new this.medicationModel(createMedicationDto);
    const savedMedication = await createdMedication.save();
    return this.mapToIMedication(savedMedication);
  }

  async findAll(): Promise<IMedication[]> {
    const medications = await this.medicationModel.find().exec();
    return medications.map((medication) => this.mapToIMedication(medication));
  }

  async findOne(id: string): Promise<IMedication> {
    const medication = await this.medicationModel.findById(id).exec();
    if (!medication) {
      throw new NotFoundException(`Medication with ID "${id}" not found`);
    }
    return this.mapToIMedication(medication);
  }

  async update(
    id: string,
    updateMedicationDto: UpdateMedicationDto,
  ): Promise<IMedication> {
    const updatedMedication = await this.medicationModel
      .findByIdAndUpdate(id, updateMedicationDto, { new: true })
      .exec();
    if (!updatedMedication) {
      throw new NotFoundException(`Medication with ID "${id}" not found`);
    }
    return this.mapToIMedication(updatedMedication);
  }

  async remove(id: string): Promise<void> {
    const result = await this.medicationModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Medication with ID "${id}" not found`);
    }
  }

  private mapToIMedication(medicationDoc: MedicationDocument): IMedication {
    return {
      id: (medicationDoc._id as Types.ObjectId).toString(),
      userId: medicationDoc.userId,
      title: medicationDoc.title,
      dosage: medicationDoc.dosage,
      notes: medicationDoc.notes,
      datetimeAt: medicationDoc.datetimeAt,
      createdAt: medicationDoc.createdAt,
      updateAt: medicationDoc.updateAt,
    };
  }
}
