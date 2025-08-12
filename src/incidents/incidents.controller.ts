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
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IIncident } from './interfaces/incident.interface';

@ApiTags('incidents')
@ApiBearerAuth('JWT-auth')
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new incident' })
  @ApiBody({
    type: CreateIncidentDto,
    description: 'Data for creating a new incident',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The incident has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async create(
    @Body() createIncidentDto: CreateIncidentDto,
  ): Promise<IIncident | null> {
    return this.incidentsService.create(createIncidentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of incidents' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The incidents list',
  })
  async findAll(): Promise<IIncident[]> {
    return this.incidentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find incident by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The incident has been found.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The incident not found.',
  })
  async findOne(@Param('id') id: string): Promise<IIncident | null> {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update the incident' })
  @ApiBody({
    type: UpdateIncidentDto,
    description: 'Data for updating a incident',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The incident has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The incident not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
  ): Promise<IIncident | null> {
    return this.incidentsService.update(id, updateIncidentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove the incident' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The incident has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The incident not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.incidentsService.remove(id);
  }
}
