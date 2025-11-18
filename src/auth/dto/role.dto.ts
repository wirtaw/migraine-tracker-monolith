import { IsNotEmpty, IsString } from 'class-validator';
import { type Role } from '../enums/roles.enum';

export class RoleDto {
  @IsString()
  @IsNotEmpty()
  role!: Role;
}
