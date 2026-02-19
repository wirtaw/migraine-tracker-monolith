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
  CreateWaterDto,
} from './create-health-logs.dto';

export class UpdateWeightDto extends PartialType(CreateWeightDto) {
  @IsNotEmpty()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt?: string;
}

export class UpdateHeightDto extends PartialType(CreateHeightDto) {
  @IsNotEmpty()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt?: string;
}

export class UpdateBloodPressureDto extends PartialType(
  CreateBloodPressureDto,
) {
  @IsNotEmpty()
  @IsNumber()
  systolic?: number;

  @IsNotEmpty()
  @IsNumber()
  diastolic?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt?: string;
}

export class UpdateSleepDto extends PartialType(CreateSleepDto) {
  @IsOptional()
  @IsNumber()
  rate?: number;

  @IsOptional()
  @IsNumber()
  minutesTotal?: number;

  @IsOptional()
  @IsNumber()
  minutesDeep?: number;

  @IsOptional()
  @IsNumber()
  minutesRem?: number;

  @IsOptional()
  @IsNumber()
  timesWakeUp?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @IsOptional()
  @IsDateString()
  datetimeAt?: string;
}

export class UpdateWaterDto extends PartialType(CreateWaterDto) {
  @IsOptional()
  @IsNumber()
  ml?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  datetimeAt?: string;
}
