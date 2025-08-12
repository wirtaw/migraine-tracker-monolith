import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WeightDocument = Weight & Document;
export type HeightDocument = Height & Document;
export type BloodPressureDocument = BloodPressure & Document;
export type SleepDocument = Sleep & Document;

@Schema()
export class Weight {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  weight: number;

  @Prop()
  notes: string;

  @Prop({ required: true })
  datetimeAt: Date;
}

export const WeightSchema = SchemaFactory.createForClass(Weight);

@Schema()
export class Height {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  height: number;

  @Prop()
  notes: string;

  @Prop({ required: true })
  datetimeAt: Date;
}

export const HeightSchema = SchemaFactory.createForClass(Height);

@Schema()
export class BloodPressure {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  systolic: number;

  @Prop({ required: true })
  diastolic: number;

  @Prop()
  notes: string;

  @Prop({ required: true })
  datetimeAt: Date;
}

export const BloodPressureSchema = SchemaFactory.createForClass(BloodPressure);

@Schema()
export class Sleep {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  rate: number;

  @Prop()
  notes: string;

  @Prop({ required: true })
  startedAt: Date;

  @Prop({ required: true })
  datetimeAt: Date;
}

export const SleepSchema = SchemaFactory.createForClass(Sleep);
