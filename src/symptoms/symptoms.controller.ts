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
import { SymptomsService } from './symptoms.service';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { ISymptom } from './interfaces/symptom.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';

@ApiTags('symptoms')
@ApiBearerAuth('JWT-auth')
@Controller('symptoms')
export class SymptomsController {
  constructor(private readonly symptomsService: SymptomsService) {}

  @Roles(Role.USER)
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
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() createSymptomDto: CreateSymptomDto,
    @Req() req: RequestWithUser,
  ): Promise<ISymptom | null> {
    const encryptionKey = req?.session?.key || '';
    return this.symptomsService.create(createSymptomDto, encryptionKey);
  }

  @Roles(Role.USER)
  @Get()
  @ApiOperation({ summary: 'Get list of symptoms' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The symptoms list',
  })
  async findAll(@Req() req: RequestWithUser): Promise<ISymptom[]> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.symptomsService.findAll(encryptionKey, userId);
  }

  @Roles(Role.USER)
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
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ISymptom | null> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.symptomsService.findOne(id, encryptionKey, userId);
  }

  @Roles(Role.USER)
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
    @Req() req: RequestWithUser,
  ): Promise<ISymptom | null> {
    const encryptionKey = req?.session?.key || '';
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.symptomsService.update(
      id,
      updateSymptomDto,
      encryptionKey,
      userId,
    );
  }

  @Roles(Role.USER)
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
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.symptomsService.remove(id, userId);
  }
}
