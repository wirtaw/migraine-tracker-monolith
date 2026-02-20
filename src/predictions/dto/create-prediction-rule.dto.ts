import {
  IsString,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OperatorEnum } from '../enums/operator.enum';

export class RuleConditionDto {
  @ApiProperty({ enum: ['weather', 'solar'] })
  @IsEnum(['weather', 'solar'])
  source!: 'weather' | 'solar';

  @ApiProperty({
    enum: [
      'temperature',
      'pressure',
      'humidity',
      'uvIndex',
      'kpIndex',
      'aIndex',
    ],
  })
  @IsString()
  parameter!: string;

  @ApiProperty({ enum: ['gt', 'lt', 'eq', 'gte', 'lte'] })
  @IsEnum(['gt', 'lt', 'eq', 'gte', 'lte'])
  operator!: OperatorEnum;

  @ApiProperty()
  @IsNumber()
  value!: number;
}

export class CreatePredictionRuleDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ type: [RuleConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions!: RuleConditionDto[];

  @ApiProperty()
  @IsString()
  alertMessage!: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
