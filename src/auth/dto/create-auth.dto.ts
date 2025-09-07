import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export class CreateAuthDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  @IsLongitude()
  longitude!: string;

  @IsString()
  @IsNotEmpty()
  @IsLatitude()
  latitude!: string;

  @IsString()
  @IsNotEmpty()
  birthDate!: string;
}
