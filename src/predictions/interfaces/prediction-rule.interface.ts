import { OperatorEnum } from '../enums/operator.enum';

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

export interface IPredictionRule {
  id?: string;
  userId: string;
  name: string;
  isEnabled: boolean;
  conditions: RuleCondition[];
  alertMessage: string;
  createdAt?: Date;
  updatedAt?: Date;
}
