import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IncidentDocument = Incident & Document;

@Schema()
export class Incident {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  durationHours: number;

  @Prop()
  notes: string;

  @Prop([String])
  triggers: string[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ required: true })
  datetimeAt: Date;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
