import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NotificationTypeEnum } from '../enums/notification-type.enum';

export type NotificationDocument = Notification & Document;

@Schema()
export class Notification {
  @Prop({ required: true })
  userId!: string;

  @Prop({
    type: String,
    enum: ['risk-alert', 'system', 'pattern-match'],
    required: true,
  })
  type!: NotificationTypeEnum;

  @Prop({ required: true })
  message!: string;

  @Prop({ default: false })
  isRead!: boolean;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop()
  ruleId?: string;

  @Prop()
  incidentId?: string;

  @Prop({ default: Date.now, required: true })
  updatedAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.pre<NotificationDocument>('save', function (next) {
  this.updatedAt = new Date();
  next();
});
