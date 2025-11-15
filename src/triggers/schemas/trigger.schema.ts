import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TriggerDocument = Trigger & Document;

@Schema()
export class Trigger {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  type!: string;

  @Prop()
  note?: string;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ required: true })
  datetimeAt!: string;
}

export const TriggerSchema = SchemaFactory.createForClass(Trigger);
