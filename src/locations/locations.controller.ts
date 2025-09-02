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
import { LocationService } from './locations.service';
import { CreateLocationDto } from './dto/create-locations.dto';
import { UpdateLocationDto } from './dto/update-locations.dto';
import { ILocationData } from './interfaces/locations.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';

@ApiTags('locations')
@ApiBearerAuth('JWT-auth')
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Roles(Role.USER)
  @Post()
  @ApiOperation({ summary: 'Create a new location data entry' })
  @ApiBody({
    type: CreateLocationDto,
    description: 'Data for creating a new location entry',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The location entry has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async create(
    @Body() createLocationDto: CreateLocationDto,
  ): Promise<ILocationData | null> {
    return this.locationService.create(createLocationDto);
  }

  @Roles(Role.USER)
  @Get()
  @ApiOperation({ summary: 'Get list of location data entries' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The location data list',
  })
  async findAll(): Promise<ILocationData[]> {
    return this.locationService.findAll();
  }

  @Roles(Role.USER)
  @Get(':id')
  @ApiOperation({ summary: 'Find location data by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The location data has been found.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The location data not found.',
  })
  async findOne(@Param('id') id: string): Promise<ILocationData | null> {
    return this.locationService.findOne(id);
  }

  @Roles(Role.USER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update the location data' })
  @ApiBody({
    type: UpdateLocationDto,
    description: 'Data for updating a location data entry',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The location data has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The location data not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<ILocationData | null> {
    return this.locationService.update(id, updateLocationDto);
  }

  @Roles(Role.USER)
  @Delete(':id')
  @ApiOperation({ summary: 'Remove the location data' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The location data has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The location data not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.locationService.remove(id);
  }
}
