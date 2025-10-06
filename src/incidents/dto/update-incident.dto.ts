import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateIncidentDto } from './create-incident.dto';
import { IncidentTypeEnum } from '../enums/incident-type.enum';

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
  @IsNotEmpty()
  @IsString()
  @IsEnum(IncidentTypeEnum)
  type?: IncidentTypeEnum;

  @IsNotEmpty()
  @IsDateString()
  startTime?: string;

  @IsNotEmpty()
  @IsNumber()
  durationHours?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsDateString()
  datetimeAt?: string;
}
