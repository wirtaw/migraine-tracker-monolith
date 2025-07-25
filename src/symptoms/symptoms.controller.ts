import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
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

@ApiTags('symptoms')
@ApiBearerAuth('JWT-auth')
@Controller('symptoms')
export class SymptomsController {
  constructor(private readonly symptomsService: SymptomsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new symptoms' })
  @ApiBody({
    type: CreateSymptomDto,
    description: 'Data for creating a new symptoms',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The symptom has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  create(@Body() createSymptomDto: CreateSymptomDto) {
    return this.symptomsService.create(createSymptomDto);
  }

  @Get()
  findAll() {
    return this.symptomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.symptomsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSymptomDto: UpdateSymptomDto) {
    return this.symptomsService.update(+id, updateSymptomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.symptomsService.remove(+id);
  }
}
