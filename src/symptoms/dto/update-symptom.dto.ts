import { IsOptional, IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateSymptomDto } from './create-symptom.dto';

export class UpdateSymptomDto extends PartialType(CreateSymptomDto) {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  note: string;

  @IsNotEmpty()
  @IsNumber()
  severity: number;
}
