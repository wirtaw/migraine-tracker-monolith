import {
  IsNotEmpty,
  IsString,
  IsLatitude,
  IsLongitude,
  IsEmail,
} from 'class-validator';

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
