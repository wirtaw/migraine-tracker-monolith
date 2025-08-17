import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export class CreateAuthDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsLongitude()
  longitude: string;

  @IsString()
  @IsNotEmpty()
  @IsLatitude()
  latitude: string;

  @IsString()
  @IsNotEmpty()
  birthDate: string;

  @IsBoolean()
  emailNotifications: boolean;

  @IsBoolean()
  dailySummary: boolean;

  @IsBoolean()
  personalHealthData: boolean;
}
