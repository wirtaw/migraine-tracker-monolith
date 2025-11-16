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
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-locations.dto';
import { UpdateLocationDto } from './dto/update-locations.dto';
import { ILocation } from './interfaces/locations.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';

@ApiTags('locations')
@ApiBearerAuth('JWT-auth')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Roles(Role.USER)
  @Post()
  @ApiOperation({ summary: 'Create a new location' })
  @ApiBody({
    type: CreateLocationDto,
    description: 'Data for creating a new location',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The location has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() createLocationDto: CreateLocationDto,
    @Req() req: RequestWithUser,
  ): Promise<ILocation | null> {
    const encryptionKey = req?.session?.key || '';
    return this.locationsService.create(createLocationDto, encryptionKey);
  }

  @Roles(Role.USER)
  @Get()
  @ApiOperation({ summary: 'Get list of locations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The locations list',
  })
  async findAll(@Req() req: RequestWithUser): Promise<ILocation[]> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.locationsService.findAll(encryptionKey, userId);
  }

  @Roles(Role.USER)
  @Get(':id')
  @ApiOperation({ summary: 'Find location by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The location has been found.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The location not found.',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ILocation | null> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.locationsService.findOne(id, encryptionKey, userId);
  }

  @Roles(Role.USER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update the location' })
  @ApiBody({
    type: UpdateLocationDto,
    description: 'Data for updating a location',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The location has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The location not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @Req() req: RequestWithUser,
  ): Promise<ILocation | null> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.locationsService.update(
      id,
      updateLocationDto,
      encryptionKey,
      userId,
    );
  }

  @Roles(Role.USER)
  @Delete(':id')
  @ApiOperation({ summary: 'Remove the location' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The location has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The location not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.locationsService.remove(id, userId);
  }
}
