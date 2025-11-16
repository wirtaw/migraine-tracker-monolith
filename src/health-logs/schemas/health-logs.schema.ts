import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WeightDocument = Weight & Document;
export type HeightDocument = Height & Document;
export type BloodPressureDocument = BloodPressure & Document;
export type SleepDocument = Sleep & Document;

@Schema()
export class Weight {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  weight!: string;

  @Prop()
  notes?: string;

  @Prop({ required: true })
  datetimeAt!: string;
}

export const WeightSchema = SchemaFactory.createForClass(Weight);

@Schema()
export class Height {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  height!: string;

  @Prop()
  notes?: string;

  @Prop({ required: true })
  datetimeAt!: string;
}

export const HeightSchema = SchemaFactory.createForClass(Height);

@Schema()
export class BloodPressure {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  systolic!: string;

  @Prop({ required: true })
  diastolic!: string;

  @Prop()
  notes?: string;

  @Prop({ required: true })
  datetimeAt!: string;
}

export const BloodPressureSchema = SchemaFactory.createForClass(BloodPressure);

@Schema()
export class Sleep {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  rate!: string;

  @Prop()
  notes?: string;

  @Prop({ required: true })
  startedAt!: string;

  @Prop({ required: true })
  datetimeAt!: string;
}

export const SleepSchema = SchemaFactory.createForClass(Sleep);
