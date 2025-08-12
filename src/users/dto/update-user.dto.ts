import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsNotEmpty()
  @IsString()
  longitude: string;

  @IsNotEmpty()
  @IsString()
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
  salt: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}
