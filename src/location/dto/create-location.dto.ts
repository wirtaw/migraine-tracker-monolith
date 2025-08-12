import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSolarDto {
  @IsOptional()
  @IsNumber()
  kIndex: number | null;

  @IsOptional()
  @IsNumber()
  aIndex: number | null;

  @IsOptional()
  @IsNumber()
  flareProbability: number | null;

  @IsNotEmpty()
  @IsString()
  datetime: string;
}

export class CreateForecastDto {
  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  temperature: number | null;

  @IsOptional()
  @IsNumber()
  pressure: number | null;

  @IsOptional()
  @IsNumber()
  humidity: number | null;

  @IsOptional()
  @IsNumber()
  windSpeed: number | null;

  @IsOptional()
  @IsNumber()
  clouds: number | null;

  @IsOptional()
  @IsNumber()
  uvi: number | null;

  @IsNotEmpty()
  @IsString()
  datetime: string;
}

export class CreateSolarRadiationDto {
  @IsOptional()
  @IsNumber()
  uviIndex: number | null;

  @IsOptional()
  @IsNumber()
  ozone: number | null;

  @IsOptional()
  @IsNumber()
  solarFlux: number | null;

  @IsOptional()
  @IsNumber()
  sunsPotNumber: number | null;

  @IsNotEmpty()
  @IsString()
  date: string;
}

export class CreateLocationDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

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

  @IsNotEmpty()
  @IsDateString()
  datetimeAt: Date;

  @IsOptional()
  @IsString()
  incidentId: string | null;
}
