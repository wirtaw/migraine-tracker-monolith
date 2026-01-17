import { createHash } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from './schemas/incident.schema';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IIncident } from './interfaces/incident.interface';
import { EncryptionService } from '../auth/encryption/encryption.service';
import { DateTime } from 'luxon';
import { IncidentTypeEnum } from './enums/incident-type.enum';
import { TriggerTypeEnum } from '../triggers/enums/trigger-type.enum';
import { IIncidentStats } from './interfaces/incident-stats.interface';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(
    createIncidentDto: CreateIncidentDto,
    key: string,
  ): Promise<IIncident> {
    const bufferKey = createHash('sha256').update(key).digest();
    const createdIncident = new this.incidentModel({
      ...createIncidentDto,
      type: this.encryptionService.encryptSensitiveData(
        createIncidentDto.type,
        bufferKey,
      ),
      startTime: this.encryptionService.encryptSensitiveData(
        createIncidentDto.startTime,
        bufferKey,
      ),
      durationHours: this.encryptionService.encryptSensitiveData(
        createIncidentDto.durationHours.toString(),
        bufferKey,
      ),
      notes: createIncidentDto.notes
        ? this.encryptionService.encryptSensitiveData(
            createIncidentDto.notes,
            bufferKey,
          )
        : '',
      triggers: this.encryptionService.encryptSensitiveData(
        JSON.stringify(createIncidentDto.triggers || []),
        bufferKey,
      ),
      datetimeAt: this.encryptionService.encryptSensitiveData(
        createIncidentDto.datetimeAt,
        bufferKey,
      ),
    });

    const savedIncident = await createdIncident.save();

    return this.mapToIIncident(savedIncident, key);
  }

  async getStats(key: string, userId: string): Promise<IIncidentStats> {
    const incidents = await this.findAll(key, userId);

    const stats: IIncidentStats = {
      byType: {} as Record<IncidentTypeEnum, number>,
      byTrigger: {} as Record<TriggerTypeEnum, number>,
      byTime: {
        dailyCounts: {},
        totalDurationHours: 0,
        averageDurationHours: 0,
        totalIncidents: 0,
      },
    };

    incidents.forEach((incident) => {
      // By Type
      stats.byType[incident.type] = (stats.byType[incident.type] || 0) + 1;

      // By Trigger
      if (incident.triggers) {
        incident.triggers.forEach((trigger) => {
          stats.byTrigger[trigger] = (stats.byTrigger[trigger] || 0) + 1;
        });
      }

      // By Time
      const dateKey = DateTime.fromJSDate(incident.datetimeAt).toFormat(
        'yyyy-MM-dd',
      );
      stats.byTime.dailyCounts[dateKey] =
        (stats.byTime.dailyCounts[dateKey] || 0) + 1;

      stats.byTime.totalDurationHours += incident.durationHours;
      stats.byTime.totalIncidents++;
    });

    // Round total duration to 2 decimal places
    stats.byTime.totalDurationHours = parseFloat(
      stats.byTime.totalDurationHours.toFixed(2),
    );

    if (stats.byTime.totalIncidents > 0) {
      stats.byTime.averageDurationHours = parseFloat(
        (stats.byTime.totalDurationHours / stats.byTime.totalIncidents).toFixed(
          2,
        ),
      );
    }

    return stats;
  }

  async findAll(key: string, userId: string): Promise<IIncident[]> {
    const incidents = await this.incidentModel.find({ userId }).exec();

    const result = incidents
      .map((incident) => this.mapToIIncident(incident, key))
      .filter((item) => !!item);

    return result;
  }

  async findOne(id: string, key: string, userId: string): Promise<IIncident> {
    const incident = await this.incidentModel.findById(id).exec();
    if (!incident) {
      throw new NotFoundException(`Incident with ID "${id}" not found`);
    }

    if (incident.userId !== userId) {
      throw new ForbiddenException(`Access denied to incident "${id}"`);
    }

    return this.mapToIIncident(incident, key);
  }

  async update(
    id: string,
    updateIncidentDto: UpdateIncidentDto,
    key: string,
    userId: string,
  ): Promise<IIncident> {
    const incident = await this.incidentModel.findById(id).exec();
    if (!incident) {
      throw new NotFoundException(`Incident with ID "${id}" not found`);
    }

    if (incident.userId !== userId) {
      throw new ForbiddenException(`Access denied to incident "${id}"`);
    }

    const bufferKey = createHash('sha256').update(key).digest();

    const encryptedUpdate: Partial<Incident> = {};

    if (updateIncidentDto.type !== undefined) {
      encryptedUpdate.type = this.encryptionService.encryptSensitiveData(
        updateIncidentDto.type,
        bufferKey,
      );
    }

    if (updateIncidentDto.startTime !== undefined) {
      encryptedUpdate.startTime = this.encryptionService.encryptSensitiveData(
        new Date(updateIncidentDto.startTime).toISOString(),
        bufferKey,
      );
    }

    if (updateIncidentDto.durationHours !== undefined) {
      encryptedUpdate.durationHours =
        this.encryptionService.encryptSensitiveData(
          updateIncidentDto.durationHours.toString(),
          bufferKey,
        );
    }

    if (updateIncidentDto.notes) {
      encryptedUpdate.notes = this.encryptionService.encryptSensitiveData(
        updateIncidentDto.notes,
        bufferKey,
      );
    }

    if (updateIncidentDto.triggers !== undefined) {
      encryptedUpdate.triggers = this.encryptionService.encryptSensitiveData(
        JSON.stringify(updateIncidentDto.triggers),
        bufferKey,
      );
    }

    if (updateIncidentDto.datetimeAt !== undefined) {
      encryptedUpdate.datetimeAt = this.encryptionService.encryptSensitiveData(
        new Date(updateIncidentDto.datetimeAt).toISOString(),
        bufferKey,
      );
    }

    if (
      updateIncidentDto.startTime &&
      updateIncidentDto.datetimeAt &&
      new Date(updateIncidentDto.datetimeAt) <
        new Date(updateIncidentDto.startTime)
    ) {
      throw new BadRequestException(
        'datetimeAt cannot be earlier than startTime',
      );
    }

    const updatedIncident = await this.incidentModel
      .findByIdAndUpdate(id, encryptedUpdate, { new: true })
      .exec();

    if (!updatedIncident) {
      throw new NotFoundException(`Incident with ID "${id}" not found`);
    }

    return this.mapToIIncident(updatedIncident, key);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.incidentModel
      .deleteOne({ _id: id, userId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Incident with ID "${id}" not found`);
    }
  }

  private mapToIIncident(
    incidentDoc: IncidentDocument,
    key: string,
  ): IIncident {
    const bufferKey = createHash('sha256').update(key).digest();

    const decrypt = (value: unknown, type: string = 'unkown'): string => {
      if (typeof value === 'string')
        return this.encryptionService.decryptSensitiveData(value, bufferKey);
      Logger.error(`Expected string got ${typeof value} for ${type}`);
      throw new Error(`Expected string got ${typeof value} for ${type}`);
    };

    const decryptedType = decrypt(incidentDoc.type, 'incidentType');

    const matchedKey = Object.entries(IncidentTypeEnum).find(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      ([key, value]) => key === decryptedType || value === decryptedType,
    );

    if (!matchedKey) {
      Logger.error(`Invalid incident type: ${decryptedType}`);
      throw new Error(`Invalid incident type: ${decryptedType}`);
    }

    const incidentType = matchedKey[1] as IncidentTypeEnum;

    let decryptedTriggers: TriggerTypeEnum[] | undefined = undefined;

    if (incidentDoc.triggers) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const decryptedTriggersData: string[] | [] = JSON.parse(
          decrypt(incidentDoc.triggers ?? '[]', 'triggers'),
        );

        decryptedTriggers = decryptedTriggersData.map((triggerItem: string) => {
          const matchedTriggerKey = Object.entries(TriggerTypeEnum).find(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            ([key, value]) => key === triggerItem || value === triggerItem,
          );

          if (!matchedTriggerKey) {
            Logger.error(`Invalid incident trigger: ${decryptedType}`);
            throw new Error(`Invalid incident trigger: ${decryptedType}`);
          }

          return matchedTriggerKey[1] as TriggerTypeEnum;
        });
      } catch {
        Logger.error(`Invalid incident triggers: ${incidentDoc.triggers}`);
        throw new Error(`Invalid incident triggers: ${incidentDoc.triggers}`);
      }
    }

    return {
      id: incidentDoc?._id?.toString() ?? '',
      userId: incidentDoc.userId,
      type: incidentType,
      startTime: new Date(decrypt(String(incidentDoc.startTime), 'startTime')),
      durationHours: parseFloat(
        decrypt(String(incidentDoc.durationHours), 'durationHours'),
      ),
      notes: incidentDoc.notes
        ? decrypt(incidentDoc.notes, 'notes')
        : undefined,
      triggers: decryptedTriggers,
      createdAt: incidentDoc.createdAt,
      datetimeAt: new Date(
        decrypt(String(incidentDoc.datetimeAt), 'datetimeAt'),
      ),
    };
  }
}
