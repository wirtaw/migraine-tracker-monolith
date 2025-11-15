import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMedicationDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  dosage!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt!: string;
}
