import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MedicationDocument = Medication & Document;

@Schema()
export class Medication {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  dosage: string;

  @Prop()
  notes: string;

  @Prop({ required: true })
  datetimeAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updateAt: Date;
}

export const MedicationSchema = SchemaFactory.createForClass(Medication);

MedicationSchema.pre('save', function (next) {
  this.updateAt = new Date();
  next();
});
