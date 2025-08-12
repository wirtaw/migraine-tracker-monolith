import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';

@ApiTags('user')
@ApiBearerAuth('JWT-auth')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user data entry' })
  @ApiBody({
    type: CreateUserDto,
    description: 'Data for creating a new user entry',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<IUser | null> {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of user data entries' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user data list',
  })
  async findAll(): Promise<IUser[]> {
    return this.userService.findAll();
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Find user data by userId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user data has been found.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The user data not found.',
  })
  async findOne(@Param('userId') userId: string): Promise<IUser | null> {
    return this.userService.findOne(userId);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update the user data' })
  @ApiBody({
    type: UpdateUserDto,
    description: 'Data for updating a user data entry',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The user data has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The user data not found.',
  })
  async update(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<IUser | null> {
    return this.userService.update(userId, updateUserDto);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Remove the user data' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The user data has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The user data not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('userId') userId: string): Promise<void> {
    return this.userService.remove(userId);
  }
}
