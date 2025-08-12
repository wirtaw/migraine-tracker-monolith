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
import { HealthLogsService } from './health-logs.service';
import {
  CreateWeightDto,
  CreateHeightDto,
  CreateBloodPressureDto,
  CreateSleepDto,
} from './dto/create-health-logs.dto';
import {
  UpdateWeightDto,
  UpdateHeightDto,
  UpdateBloodPressureDto,
  UpdateSleepDto,
} from './dto/update-health-logs.dto';
import {
  IWeight,
  IHeight,
  IBloodPressure,
  ISleep,
} from './interfaces/health-logs.interface';

@ApiTags('health-logs')
@ApiBearerAuth('JWT-auth')
@Controller('health-logs')
export class HealthLogsController {
  constructor(private readonly healthLogsService: HealthLogsService) {}

  // Weight
  @Post('weight')
  @ApiOperation({ summary: 'Create a new weight log' })
  @ApiBody({
    type: CreateWeightDto,
    description: 'Data for creating a new weight log',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The weight log has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async createWeight(
    @Body() createWeightDto: CreateWeightDto,
  ): Promise<IWeight | null> {
    return this.healthLogsService.createWeight(createWeightDto);
  }

  @Get('weights')
  @ApiOperation({ summary: 'Get list of weight logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The weight logs list',
  })
  async findAllWeights(): Promise<IWeight[]> {
    return this.healthLogsService.findAllWeights();
  }

  @Get('weight/:id')
  @ApiOperation({ summary: 'Find weight log by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The weight log has been found.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The weight log not found.',
  })
  async findOneWeight(@Param('id') id: string): Promise<IWeight | null> {
    return this.healthLogsService.findOneWeight(id);
  }

  @Patch('weight/:id')
  @ApiOperation({ summary: 'Update the weight log' })
  @ApiBody({
    type: UpdateWeightDto,
    description: 'Data for updating a weight log',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The weight log has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The weight log not found.',
  })
  async updateWeight(
    @Param('id') id: string,
    @Body() updateWeightDto: UpdateWeightDto,
  ): Promise<IWeight | null> {
    return this.healthLogsService.updateWeight(id, updateWeightDto);
  }

  @Delete('weight/:id')
  @ApiOperation({ summary: 'Remove the weight log' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The weight log has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The weight log not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeWeight(@Param('id') id: string): Promise<void> {
    return this.healthLogsService.removeWeight(id);
  }

  // Height
  @Post('height')
  @ApiOperation({ summary: 'Create a new height log' })
  @ApiBody({
    type: CreateHeightDto,
    description: 'Data for creating a new height log',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The height log has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async createHeight(
    @Body() createHeightDto: CreateHeightDto,
  ): Promise<IHeight | null> {
    return this.healthLogsService.createHeight(createHeightDto);
  }

  @Get('heights')
  @ApiOperation({ summary: 'Get list of height logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The height logs list',
  })
  async findAllHeights(): Promise<IHeight[]> {
    return this.healthLogsService.findAllHeights();
  }

  @Get('height/:id')
  @ApiOperation({ summary: 'Find height log by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The height log has been found.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The height log not found.',
  })
  async findOneHeight(@Param('id') id: string): Promise<IHeight | null> {
    return this.healthLogsService.findOneHeight(id);
  }

  @Patch('height/:id')
  @ApiOperation({ summary: 'Update the height log' })
  @ApiBody({
    type: UpdateHeightDto,
    description: 'Data for updating a height log',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The height log has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The height log not found.',
  })
  async updateHeight(
    @Param('id') id: string,
    @Body() updateHeightDto: UpdateHeightDto,
  ): Promise<IHeight | null> {
    return this.healthLogsService.updateHeight(id, updateHeightDto);
  }

  @Delete('height/:id')
  @ApiOperation({ summary: 'Remove the height log' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The height log has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The height log not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeHeight(@Param('id') id: string): Promise<void> {
    return this.healthLogsService.removeHeight(id);
  }

  // Blood Pressure
  @Post('blood-pressure')
  @ApiOperation({ summary: 'Create a new blood pressure log' })
  @ApiBody({
    type: CreateBloodPressureDto,
    description: 'Data for creating a new blood pressure log',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The blood pressure log has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async createBloodPressure(
    @Body() createBloodPressureDto: CreateBloodPressureDto,
  ): Promise<IBloodPressure | null> {
    return this.healthLogsService.createBloodPressure(createBloodPressureDto);
  }

  @Get('blood-pressures')
  @ApiOperation({ summary: 'Get list of blood pressure logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The blood pressure logs list',
  })
  async findAllBloodPressures(): Promise<IBloodPressure[]> {
    return this.healthLogsService.findAllBloodPressures();
  }

  @Get('blood-pressure/:id')
  @ApiOperation({ summary: 'Find blood pressure log by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The blood pressure log has been found.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The blood pressure log not found.',
  })
  async findOneBloodPressure(
    @Param('id') id: string,
  ): Promise<IBloodPressure | null> {
    return this.healthLogsService.findOneBloodPressure(id);
  }

  @Patch('blood-pressure/:id')
  @ApiOperation({ summary: 'Update the blood pressure log' })
  @ApiBody({
    type: UpdateBloodPressureDto,
    description: 'Data for updating a blood pressure log',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The blood pressure log has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The blood pressure log not found.',
  })
  async updateBloodPressure(
    @Param('id') id: string,
    @Body() updateBloodPressureDto: UpdateBloodPressureDto,
  ): Promise<IBloodPressure | null> {
    return this.healthLogsService.updateBloodPressure(
      id,
      updateBloodPressureDto,
    );
  }

  @Delete('blood-pressure/:id')
  @ApiOperation({ summary: 'Remove the blood pressure log' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The blood pressure log has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The blood pressure log not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeBloodPressure(@Param('id') id: string): Promise<void> {
    return this.healthLogsService.removeBloodPressure(id);
  }

  // Sleep
  @Post('sleep')
  @ApiOperation({ summary: 'Create a new sleep log' })
  @ApiBody({
    type: CreateSleepDto,
    description: 'Data for creating a new sleep log',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The sleep log has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async createSleep(
    @Body() createSleepDto: CreateSleepDto,
  ): Promise<ISleep | null> {
    return this.healthLogsService.createSleep(createSleepDto);
  }

  @Get('sleeps')
  @ApiOperation({ summary: 'Get list of sleep logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The sleep logs list',
  })
  async findAllSleeps(): Promise<ISleep[]> {
    return this.healthLogsService.findAllSleeps();
  }

  @Get('sleep/:id')
  @ApiOperation({ summary: 'Find sleep log by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The sleep log has been found.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The sleep log not found.',
  })
  async findOneSleep(@Param('id') id: string): Promise<ISleep | null> {
    return this.healthLogsService.findOneSleep(id);
  }

  @Patch('sleep/:id')
  @ApiOperation({ summary: 'Update the sleep log' })
  @ApiBody({
    type: UpdateSleepDto,
    description: 'Data for updating a sleep log',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The sleep log has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The sleep log not found.',
  })
  async updateSleep(
    @Param('id') id: string,
    @Body() updateSleepDto: UpdateSleepDto,
  ): Promise<ISleep | null> {
    return this.healthLogsService.updateSleep(id, updateSleepDto);
  }

  @Delete('sleep/:id')
  @ApiOperation({ summary: 'Remove the sleep log' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The sleep log has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The sleep log not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSleep(@Param('id') id: string): Promise<void> {
    return this.healthLogsService.removeSleep(id);
  }
}
