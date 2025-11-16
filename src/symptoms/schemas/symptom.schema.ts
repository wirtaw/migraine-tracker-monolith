import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SymptomDocument = Symptom & Document;

@Schema()
export class Symptom {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  severity!: string;

  @Prop()
  note?: string;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ required: true })
  datetimeAt!: string;
}

export const SymptomSchema = SchemaFactory.createForClass(Symptom);
