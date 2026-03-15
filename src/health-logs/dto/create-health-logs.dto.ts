import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateWeightDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsNumber()
  weight!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt!: string;
}

export class CreateHeightDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsNumber()
  height!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt!: string;
}

export class CreateBloodPressureDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

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
  datetimeAt!: string;
}

export class CreateSleepDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsOptional()
  @IsNumber()
  rate!: number;

  @IsOptional()
  @IsNumber()
  minutesTotal!: number;

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

  @IsNotEmpty()
  @IsDateString()
  datetimeAt!: string;
}

export class CreateWaterDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsNumber()
  ml!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt!: string;
}
