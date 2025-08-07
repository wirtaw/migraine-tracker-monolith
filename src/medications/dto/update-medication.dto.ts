import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicationDto } from './create-medication.dto';

export class UpdateMedicationDto extends PartialType(CreateMedicationDto) {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  datetimeAt?: Date;
}
