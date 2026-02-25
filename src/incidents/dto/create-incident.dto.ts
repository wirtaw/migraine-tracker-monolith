import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
} from 'class-validator';
import { IncidentTypeEnum } from '../enums/incident-type.enum';

export class CreateIncidentDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsString()
  type!: string | IncidentTypeEnum;

  @IsNotEmpty()
  @IsDateString()
  startTime!: string;

  @IsNotEmpty()
  @IsNumber()
  durationHours!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  triggers?: string[];

  @IsNotEmpty()
  @IsDateString()
  datetimeAt!: string;
}
