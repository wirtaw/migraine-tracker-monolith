import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
} from 'class-validator';

export class CreateIncidentDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsDateString()
  startTime: Date;

  @IsNotEmpty()
  @IsNumber()
  durationHours: number;

  @IsOptional()
  @IsString()
  notes: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  triggers: string[];

  @IsNotEmpty()
  @IsDateString()
  datetimeAt: Date;
}
