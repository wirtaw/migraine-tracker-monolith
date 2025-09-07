import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { IncidentTypeEnum } from '../enums/incident-type.enum';
import { TriggerTypeEnum } from '../../triggers/enums/trigger-type.enum';

export class CreateIncidentDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsEnum(IncidentTypeEnum)
  type!: IncidentTypeEnum;

  @IsNotEmpty()
  @IsDateString()
  startTime!: Date;

  @IsNotEmpty()
  @IsNumber()
  durationHours!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(TriggerTypeEnum, { each: true })
  triggers?: TriggerTypeEnum[];

  @IsNotEmpty()
  @IsDateString()
  datetimeAt!: Date;
}
