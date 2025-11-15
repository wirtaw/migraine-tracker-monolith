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
import { MedicationsService } from './medications.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { IMedication } from './interfaces/medication.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';

@ApiTags('medications')
@ApiBearerAuth('JWT-auth')
@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Roles(Role.USER)
  @Post()
  @ApiOperation({ summary: 'Create a new medication' })
  @ApiBody({
    type: CreateMedicationDto,
    description: 'Data for creating a new medication',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The medication has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() createMedicationDto: CreateMedicationDto,
    @Req() req: RequestWithUser,
  ): Promise<IMedication | null> {
    const encryptionKey = req?.session?.key || '';
    return this.medicationsService.create(createMedicationDto, encryptionKey);
  }

  @Roles(Role.USER)
  @Get()
  @ApiOperation({ summary: 'Get list medications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The medications list',
  })
  async findAll(@Req() req: RequestWithUser): Promise<IMedication[]> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.medicationsService.findAll(encryptionKey, userId);
  }

  @Roles(Role.USER)
  @Get(':id')
  @ApiOperation({ summary: 'Find medication by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The medication has been founded.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The medication not found.',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<IMedication | null> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.medicationsService.findOne(id, encryptionKey, userId);
  }

  @Roles(Role.USER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update the medication' })
  @ApiBody({
    type: UpdateMedicationDto,
    description: 'Data for updating a medication',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The medication has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The medication not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateMedicationDto: UpdateMedicationDto,
    @Req() req: RequestWithUser,
  ): Promise<IMedication | null> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.medicationsService.update(
      id,
      updateMedicationDto,
      encryptionKey,
      userId,
    );
  }

  @Roles(Role.USER)
  @Delete(':id')
  @ApiOperation({ summary: 'Remove the medication' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The medication has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The medication not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.medicationsService.remove(id, userId);
  }
}
