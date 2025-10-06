import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IncidentDocument = Incident & Document;

@Schema()
export class Incident {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  startTime!: string;

  @Prop({ required: true })
  durationHours!: string;

  @Prop()
  notes?: string;

  @Prop()
  triggers?: string;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ required: true })
  datetimeAt!: string;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
