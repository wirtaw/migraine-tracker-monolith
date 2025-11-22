import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserProfileDto extends PartialType(CreateUserDto) {
  @IsNotEmpty()
  @IsString()
  @IsLongitude()
  longitude!: string;

  @IsNotEmpty()
  @IsString()
  @IsLatitude()
  latitude!: string;

  @IsNotEmpty()
  @IsString()
  birthDate!: string;

  @IsNotEmpty()
  @IsBoolean()
  emailNotifications!: boolean;
}
