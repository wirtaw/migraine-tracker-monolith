import {
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  CreateLocationDto,
  CreateForecastDto,
  CreateSolarDto,
  CreateSolarRadiationDto,
} from './create-location.dto';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateForecastDto)
  forecast: CreateForecastDto[] | [];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSolarDto)
  solar: CreateSolarDto[] | [];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSolarRadiationDto)
  solarRadiation: CreateSolarRadiationDto[] | [];
}
