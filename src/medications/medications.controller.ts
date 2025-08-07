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
import { MedicationsService } from './medications.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { IMedication } from './interfaces/medication.interface';

@ApiTags('medications')
@ApiBearerAuth('JWT-auth')
@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

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
  async create(
    @Body() createMedicationDto: CreateMedicationDto,
  ): Promise<IMedication | null> {
    return this.medicationsService.create(createMedicationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list medications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The medications list',
  })
  async findAll(): Promise<IMedication[]> {
    return this.medicationsService.findAll();
  }

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
  async findOne(@Param('id') id: string): Promise<IMedication | null> {
    return this.medicationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update the medication' })
  @ApiBody({
    type: UpdateMedicationDto,
    description: 'Data for updating a medication',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
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
  ): Promise<IMedication | null> {
    return this.medicationsService.update(id, updateMedicationDto);
  }

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
  remove(@Param('id') id: string): Promise<void> {
    return this.medicationsService.remove(id);
  }
}
