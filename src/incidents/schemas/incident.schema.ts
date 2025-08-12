import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { IncidentTypeEnum } from '../enums/incident-type.enum';
import { TriggerTypeEnum } from '../../triggers/enums/trigger-type.enum';

export type IncidentDocument = Incident & Document;

@Schema()
export class Incident {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: IncidentTypeEnum })
  type: IncidentTypeEnum;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  durationHours: number;

  @Prop()
  notes: string;

  @Prop([
    {
      type: String,
      enum: TriggerTypeEnum,
    },
  ])
  triggers: TriggerTypeEnum[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ required: true })
  datetimeAt: Date;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
