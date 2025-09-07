import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import {
  CreateWeightDto,
  CreateHeightDto,
  CreateBloodPressureDto,
  CreateSleepDto,
} from './create-health-logs.dto';

export class UpdateWeightDto extends PartialType(CreateWeightDto) {
  @IsNotEmpty()
  @IsNumber()
  weight!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt!: Date;
}

export class UpdateHeightDto extends PartialType(CreateHeightDto) {
  @IsNotEmpty()
  @IsNumber()
  height!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt!: Date;
}

export class UpdateBloodPressureDto extends PartialType(
  CreateBloodPressureDto,
) {
  @IsNotEmpty()
  @IsNumber()
  systolic!: number;

  @IsNotEmpty()
  @IsNumber()
  diastolic!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt!: Date;
}

export class UpdateSleepDto extends PartialType(CreateSleepDto) {
  @IsNotEmpty()
  @IsNumber()
  rate!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsDateString()
  startedAt!: Date;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt!: Date;
}
