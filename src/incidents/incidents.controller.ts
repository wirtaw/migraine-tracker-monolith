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
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { RequestWithUser } from 'src/auth/interfaces/auth.user.interface';

@ApiTags('incidents')
@ApiBearerAuth('JWT-auth')
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Roles(Role.USER)
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
    @Req() req: RequestWithUser,
    @Body() createIncidentDto: CreateIncidentDto,
  ): Promise<IIncident | null> {
    const encryptionKey = req?.session?.key || '';
    return this.incidentsService.create(createIncidentDto, encryptionKey);
  }

  @Roles(Role.USER)
  @Get()
  @ApiOperation({ summary: 'Get list of incidents' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The incidents list',
  })
  async findAll(@Req() req: RequestWithUser): Promise<IIncident[]> {
    const encryptionKey = req?.session?.key || '';
    return this.incidentsService.findAll(encryptionKey);
  }

  @Roles(Role.USER)
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
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<IIncident | null> {
    const encryptionKey = req?.session?.key || '';
    return this.incidentsService.findOne(id, encryptionKey);
  }

  @Roles(Role.USER)
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
    @Req() req: RequestWithUser,
  ): Promise<IIncident | null> {
    const encryptionKey = req?.session?.key || '';
    return this.incidentsService.update(id, updateIncidentDto, encryptionKey);
  }

  @Roles(Role.USER)
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
