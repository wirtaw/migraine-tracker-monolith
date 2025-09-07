import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Incident, IncidentDocument } from './schemas/incident.schema';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IIncident } from './interfaces/incident.interface';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {}

  async create(createIncidentDto: CreateIncidentDto): Promise<IIncident> {
    const createdIncident = new this.incidentModel(createIncidentDto);
    const savedIncident = await createdIncident.save();
    return this.mapToIIncident(savedIncident);
  }

  async findAll(): Promise<IIncident[]> {
    const incidents = await this.incidentModel.find().exec();
    return incidents
      .map((incident) => this.mapToIIncident(incident))
      .filter((item) => !!item);
  }

  async findOne(id: string): Promise<IIncident> {
    const incident = await this.incidentModel.findById(id).exec();
    if (!incident) {
      throw new NotFoundException(`Incident with ID "${id}" not found`);
    }
    return this.mapToIIncident(incident);
  }

  async update(
    id: string,
    updateIncidentDto: UpdateIncidentDto,
  ): Promise<IIncident> {
    const updatedIncident = await this.incidentModel
      .findByIdAndUpdate(id, updateIncidentDto, { new: true })
      .exec();
    if (!updatedIncident) {
      throw new NotFoundException(`Incident with ID "${id}" not found`);
    }
    return this.mapToIIncident(updatedIncident);
  }

  async remove(id: string): Promise<void> {
    const result = await this.incidentModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Incident with ID "${id}" not found`);
    }
  }

  private mapToIIncident(incidentDoc: IncidentDocument): IIncident {
    return {
      id:
        incidentDoc && incidentDoc?._id
          ? (incidentDoc._id as Types.ObjectId).toString()
          : '',
      userId: incidentDoc.userId,
      type: incidentDoc.type,
      startTime: incidentDoc.startTime,
      durationHours: incidentDoc.durationHours,
      notes: incidentDoc?.notes,
      triggers: incidentDoc?.triggers,
      createdAt: incidentDoc.createdAt,
      datetimeAt: incidentDoc.datetimeAt,
    };
  }
}
