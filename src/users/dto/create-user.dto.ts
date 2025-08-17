import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFetchDataErrorsDto {
  @IsNotEmpty()
  @IsString()
  forecast: string;

  @IsNotEmpty()
  @IsString()
  magneticWeather: string;
}

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  @IsLongitude()
  longitude: string;

  @IsNotEmpty()
  @IsString()
  @IsLatitude()
  latitude: string;

  @IsNotEmpty()
  @IsString()
  birthDate: string;

  @IsNotEmpty()
  @IsBoolean()
  emailNotifications: boolean;

  @IsNotEmpty()
  @IsBoolean()
  dailySummary: boolean;

  @IsNotEmpty()
  @IsBoolean()
  personalHealthData: boolean;

  @IsNotEmpty()
  @IsBoolean()
  securitySetup: boolean;

  @IsNotEmpty()
  @IsBoolean()
  profileFilled: boolean;

  @IsNotEmpty()
  @IsString()
  userPassphrase: string;

  @ValidateNested()
  @Type(() => CreateFetchDataErrorsDto)
  fetchDataErrors: CreateFetchDataErrorsDto;

  @IsNotEmpty()
  @IsBoolean()
  fetchMagneticWeather: boolean;

  @IsNotEmpty()
  @IsBoolean()
  fetchWeather: boolean;
}
