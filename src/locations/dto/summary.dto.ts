import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetSummaryQueryDto {
  @ApiProperty({
    description: 'Latitude of the location',
    example: 52.52,
    type: Number,
  })
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  latitude!: number;

  @ApiProperty({
    description: 'Longitude of the location',
    example: 13.41,
    type: Number,
  })
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  longitude!: number;

  @ApiProperty({
    description: 'Date in ISO format (YYYY-MM-DD)',
    example: '2023-10-27',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  isoDate?: string;

  @ApiProperty({
    description: 'Location ID',
    example: '6578a9b...',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Incident ID',
    example: '6578b1c...',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  incidentId?: string;

  // userId is typically extracted from the request usually, but keeping it if needed by the logic
  // However, in the controller we can extract it from the RequestWithUser
}
