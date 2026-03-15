import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ForecastDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  pressure?: number;

  @IsOptional()
  @IsNumber()
  humidity?: number;

  @IsOptional()
  @IsNumber()
  windSpeed?: number;

  @IsOptional()
  @IsNumber()
  clouds?: number;

  @IsOptional()
  @IsNumber()
  uvi?: number;

  @IsOptional()
  @IsNumber()
  directRadiation?: number;

  @IsNotEmpty()
  @IsString()
  datetime!: string;
}

export class SolarDto {
  @IsOptional()
  @IsNumber()
  kIndex?: number;

  @IsOptional()
  @IsNumber()
  aIndex?: number;

  @IsOptional()
  @IsNumber()
  flareProbability?: number;

  @IsNotEmpty()
  @IsString()
  datetime!: string;
}

export class SolarRadiationDto {
  @IsOptional()
  @IsNumber()
  uviIndex?: number;

  @IsOptional()
  @IsNumber()
  ozone?: number;

  @IsOptional()
  @IsNumber()
  solarFlux?: number;

  @IsOptional()
  @IsNumber()
  sunsPotNumber?: number;

  @IsNotEmpty()
  @IsString()
  date!: string;
}

export class CreateLocationDto {
  @IsOptional()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsNumber()
  latitude!: number;

  @IsNotEmpty()
  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ForecastDto)
  forecast?: ForecastDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SolarDto)
  solar?: SolarDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SolarRadiationDto)
  solarRadiation?: SolarRadiationDto[];

  @IsNotEmpty()
  @IsDateString()
  datetimeAt!: string;

  @IsOptional()
  @IsString()
  incidentId?: string;
}
