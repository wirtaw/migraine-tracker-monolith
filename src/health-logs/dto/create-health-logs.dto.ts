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
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  weight: number;

  @IsOptional()
  @IsString()
  notes: string;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt: Date;
}

export class CreateHeightDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  height: number;

  @IsOptional()
  @IsString()
  notes: string;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt: Date;
}

export class CreateBloodPressureDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  systolic: number;

  @IsNotEmpty()
  @IsNumber()
  diastolic: number;

  @IsOptional()
  @IsString()
  notes: string;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt: Date;
}

export class CreateSleepDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  rate: number;

  @IsOptional()
  @IsString()
  notes: string;

  @IsNotEmpty()
  @IsDateString()
  startedAt: Date;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt: Date;
}
