import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { OperatorEnum } from '../enums/operator.enum';

export type PredictionRuleDocument = PredictionRule & Document;

export type RuleConditionSource = 'weather' | 'solar';
export type RuleConditionParameter =
  | 'temperature'
  | 'pressure'
  | 'humidity'
  | 'uvIndex'
  | 'kpIndex'
  | 'aIndex';

export interface RuleCondition {
  source: RuleConditionSource;
  parameter: RuleConditionParameter;
  operator: OperatorEnum;
  value: number;
}

@Schema({ _id: false })
export class PredictionRuleCondition {
  @Prop({ type: String, enum: ['weather', 'solar'], required: true })
  source!: RuleConditionSource;

  @Prop({ required: true })
  parameter!: RuleConditionParameter;

  @Prop({
    type: String,
    enum: ['gt', 'lt', 'eq', 'gte', 'lte'],
    required: true,
  })
  operator!: OperatorEnum;

  @Prop({ required: true })
  value!: number;
}

const PredictionRuleConditionSchema = SchemaFactory.createForClass(
  PredictionRuleCondition,
);

@Schema()
export class PredictionRule {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: true })
  isEnabled!: boolean;

  @Prop({ type: [PredictionRuleConditionSchema], default: [] })
  conditions!: PredictionRuleCondition[];

  @Prop()
  alertMessage!: string;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;
}

export const PredictionRuleSchema =
  SchemaFactory.createForClass(PredictionRule);

PredictionRuleSchema.pre<PredictionRuleDocument>('save', function (next) {
  this.updatedAt = new Date();
  next();
});
