import {
  IsNotEmpty,
  IsString,
  IsLatitude,
  IsLongitude,
  IsEmail,
} from 'class-validator';

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
  supabaseId: string;

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
  @IsEmail()
  email: string;
}
