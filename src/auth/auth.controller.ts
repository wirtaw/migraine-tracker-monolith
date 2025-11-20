// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Patch,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import {
  type AuthResponse,
  RequestWithUser,
  type ChangeRoleResponse,
} from './interfaces/auth.user.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { RoleDto } from './dto/role.dto';
import { IUser } from '../users/interfaces/user.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    type: CreateAuthDto,
    description: 'Data for creating a new user',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The user has been successfully registered.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async register(@Body() createAuthDto: CreateAuthDto): Promise<AuthResponse> {
    return this.authService.register(createAuthDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in an existing user' })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials.',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login/Register with OAuth2 provider (e.g., Github)',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Supabase Access Token (Bearer <token>)',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in via OAuth.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid OAuth token or missing header.',
  })
  async loginWithOAuth(
    @Headers('authorization') authorization?: string,
  ): Promise<AuthResponse> {
    if (!authorization) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const accessToken = authorization.replace(/^Bearer\s+/i, '');

    if (!accessToken) {
      throw new UnauthorizedException('Invalid Bearer token format');
    }

    return this.authService.loginWithOAuth(accessToken);
  }

  @Roles(Role.USER)
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access.',
  })
  async getProfile(req: RequestWithUser): Promise<IUser> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.authService.getProfile(userId);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user role by admin' })
  @ApiBody({
    type: RoleDto,
    description: 'Role type',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User role successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials.',
  })
  async grantRole(
    @Param('id') userId: string,
    @Body() roleDto: RoleDto,
  ): Promise<ChangeRoleResponse> {
    return this.authService.grandRole(roleDto, userId);
  }
}
