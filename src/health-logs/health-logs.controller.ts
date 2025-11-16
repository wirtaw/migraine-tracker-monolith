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
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';

@ApiTags('health-logs')
@ApiBearerAuth('JWT-auth')
@Controller('health-logs')
export class HealthLogsController {
  constructor(private readonly healthLogsService: HealthLogsService) {}

  // Weight
  @Roles(Role.USER)
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
  @UsePipes(new ValidationPipe({ transform: true }))
  async createWeight(
    @Body() createWeightDto: CreateWeightDto,
    @Req() req: RequestWithUser,
  ): Promise<IWeight | null> {
    const encryptionKey = req?.session?.key || '';
    return this.healthLogsService.createWeight(createWeightDto, encryptionKey);
  }

  @Roles(Role.USER)
  @Get('weights')
  @ApiOperation({ summary: 'Get list of weight logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The weight logs list',
  })
  async findAllWeights(@Req() req: RequestWithUser): Promise<IWeight[]> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.findAllWeights(encryptionKey, userId);
  }

  @Roles(Role.USER)
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
  async findOneWeight(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<IWeight | null> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.findOneWeight(id, encryptionKey, userId);
  }

  @Roles(Role.USER)
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
    @Req() req: RequestWithUser,
  ): Promise<IWeight | null> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.updateWeight(
      id,
      updateWeightDto,
      encryptionKey,
      userId,
    );
  }

  @Roles(Role.USER)
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
  removeWeight(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.removeWeight(id, userId);
  }

  // Height
  @Roles(Role.USER)
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
  @UsePipes(new ValidationPipe({ transform: true }))
  async createHeight(
    @Body() createHeightDto: CreateHeightDto,
    @Req() req: RequestWithUser,
  ): Promise<IHeight | null> {
    const encryptionKey = req?.session?.key || '';
    return this.healthLogsService.createHeight(createHeightDto, encryptionKey);
  }

  @Roles(Role.USER)
  @Get('heights')
  @ApiOperation({ summary: 'Get list of height logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The height logs list',
  })
  async findAllHeights(@Req() req: RequestWithUser): Promise<IHeight[]> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.findAllHeights(encryptionKey, userId);
  }

  @Roles(Role.USER)
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
  async findOneHeight(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<IHeight | null> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.findOneHeight(id, encryptionKey, userId);
  }

  @Roles(Role.USER)
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
    @Req() req: RequestWithUser,
  ): Promise<IHeight | null> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.updateHeight(
      id,
      updateHeightDto,
      encryptionKey,
      userId,
    );
  }

  @Roles(Role.USER)
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
  removeHeight(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.removeHeight(id, userId);
  }

  // Blood Pressure
  @Roles(Role.USER)
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
  @UsePipes(new ValidationPipe({ transform: true }))
  async createBloodPressure(
    @Body() createBloodPressureDto: CreateBloodPressureDto,
    @Req() req: RequestWithUser,
  ): Promise<IBloodPressure | null> {
    const encryptionKey = req?.session?.key || '';
    return this.healthLogsService.createBloodPressure(
      createBloodPressureDto,
      encryptionKey,
    );
  }

  @Roles(Role.USER)
  @Get('blood-pressures')
  @ApiOperation({ summary: 'Get list of blood pressure logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The blood pressure logs list',
  })
  async findAllBloodPressures(
    @Req() req: RequestWithUser,
  ): Promise<IBloodPressure[]> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.findAllBloodPressures(encryptionKey, userId);
  }

  @Roles(Role.USER)
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
    @Req() req: RequestWithUser,
  ): Promise<IBloodPressure | null> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.findOneBloodPressure(
      id,
      encryptionKey,
      userId,
    );
  }

  @Roles(Role.USER)
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
    @Req() req: RequestWithUser,
  ): Promise<IBloodPressure | null> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.updateBloodPressure(
      id,
      updateBloodPressureDto,
      encryptionKey,
      userId,
    );
  }

  @Roles(Role.USER)
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
  removeBloodPressure(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.removeBloodPressure(id, userId);
  }

  // Sleep
  @Roles(Role.USER)
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
  @UsePipes(new ValidationPipe({ transform: true }))
  async createSleep(
    @Body() createSleepDto: CreateSleepDto,
    @Req() req: RequestWithUser,
  ): Promise<ISleep | null> {
    const encryptionKey = req?.session?.key || '';
    return this.healthLogsService.createSleep(createSleepDto, encryptionKey);
  }

  @Roles(Role.USER)
  @Get('sleeps')
  @ApiOperation({ summary: 'Get list of sleep logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The sleep logs list',
  })
  async findAllSleeps(@Req() req: RequestWithUser): Promise<ISleep[]> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.findAllSleeps(encryptionKey, userId);
  }

  @Roles(Role.USER)
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
  async findOneSleep(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ISleep | null> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.findOneSleep(id, encryptionKey, userId);
  }

  @Roles(Role.USER)
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
    @Req() req: RequestWithUser,
  ): Promise<ISleep | null> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.updateSleep(
      id,
      updateSleepDto,
      encryptionKey,
      userId,
    );
  }

  @Roles(Role.USER)
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
  removeSleep(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.healthLogsService.removeSleep(id, userId);
  }
}
