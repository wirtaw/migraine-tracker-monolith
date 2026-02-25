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
  ValidationPipe,
  UsePipes,
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
import { IIncidentStats } from './interfaces/incident-stats.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';
import { TriggersService } from '../triggers/triggers.service';

@ApiTags('incidents')
@ApiBearerAuth('JWT-auth')
@Controller('incidents')
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly triggersService: TriggersService,
  ) {}

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
  @UsePipes(new ValidationPipe({ transform: true }))
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
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.incidentsService.findAll(encryptionKey, userId);
  }

  @Roles(Role.USER)
  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated statistics of incidents' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The incident statistics',
  })
  async getStats(@Req() req: RequestWithUser): Promise<IIncidentStats> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.incidentsService.getStats(encryptionKey, userId);
  }

  @Roles(Role.USER)
  @Get('types')
  @ApiOperation({ summary: 'Get list of incident types for a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The incident types list',
  })
  async getTypes(@Req() req: RequestWithUser): Promise<string[]> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.incidentsService.getIncidentTypes(encryptionKey, userId);
  }

  @Roles(Role.USER)
  @Get('triggers')
  @ApiOperation({ summary: 'Get list of incident triggers for a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The incident triggers list',
  })
  async getTriggers(@Req() req: RequestWithUser): Promise<string[]> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';

    return Promise.all([
      this.incidentsService.getIncidentTriggers(encryptionKey, userId),
      this.triggersService
        .findAll(encryptionKey, userId)
        .then((triggers) => triggers.map((trigger) => trigger.type)),
    ])
      .then(([incidentTriggers, userTriggers]) => {
        const allTriggers = new Set([...incidentTriggers, ...userTriggers]);
        return Array.from(allTriggers);
      })
      .catch(() => {
        // In case of any error, return an empty array to avoid breaking the endpoint
        return [];
      });
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
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.incidentsService.findOne(id, encryptionKey, userId);
  }

  @Roles(Role.USER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update the incident' })
  @ApiBody({
    type: UpdateIncidentDto,
    description: 'Data for updating a incident',
  })
  @ApiResponse({
    status: HttpStatus.OK,
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
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.incidentsService.update(
      id,
      updateIncidentDto,
      encryptionKey,
      userId,
    );
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
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.incidentsService.remove(id, userId);
  }
}
