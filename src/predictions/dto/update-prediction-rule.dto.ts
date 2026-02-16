import { PartialType } from '@nestjs/swagger';
import { CreatePredictionRuleDto } from './create-prediction-rule.dto';

export class UpdatePredictionRuleDto extends PartialType(
  CreatePredictionRuleDto,
) {}
