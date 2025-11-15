import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateTriggerDto } from './create-trigger.dto';

export class UpdateTriggerDto extends PartialType(CreateTriggerDto) {
  @IsNotEmpty()
  @IsString()
  userId?: string;

  @IsNotEmpty()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  datetimeAt?: string;
}
