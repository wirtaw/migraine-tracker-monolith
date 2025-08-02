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
import { SymptomsService } from './symptoms.service';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { ISymptom } from './interfaces/symptom.interface';

@ApiTags('symptoms')
@ApiBearerAuth('JWT-auth')
@Controller('symptoms')
export class SymptomsController {
  constructor(private readonly symptomsService: SymptomsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new symptom' })
  @ApiBody({
    type: CreateSymptomDto,
    description: 'Data for creating a new symptom',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The symptom has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async create(
    @Body() createSymptomDto: CreateSymptomDto,
  ): Promise<ISymptom | null> {
    return this.symptomsService.create(createSymptomDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of symptoms' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The symptoms list',
  })
  async findAll(): Promise<ISymptom[]> {
    return this.symptomsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find symptom by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The symptom has been founded.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The symptom not found.',
  })
  async findOne(@Param('id') id: string): Promise<ISymptom | null> {
    return this.symptomsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update the symptom' })
  @ApiBody({
    type: UpdateSymptomDto,
    description: 'Data for updating a symptom',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The symptom has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The symptom not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateSymptomDto: UpdateSymptomDto,
  ): Promise<ISymptom | null> {
    return this.symptomsService.update(id, updateSymptomDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove the symptom' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The symptom has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The symptom not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.symptomsService.remove(id);
  }
}
