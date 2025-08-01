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
import { TriggersService } from './triggers.service';
import { CreateTriggerDto } from './dto/create-trigger.dto';
import { UpdateTriggerDto } from './dto/update-trigger.dto';
import { ITrigger } from './interfaces/trigger.interface';

@ApiTags('triggers')
@ApiBearerAuth('JWT-auth')
@Controller('triggers')
export class TriggersController {
  constructor(private readonly triggersService: TriggersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new triggers' })
  @ApiBody({
    type: CreateTriggerDto,
    description: 'Data for creating a new triggers',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The trigger has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async create(
    @Body() createTriggerDto: CreateTriggerDto,
  ): Promise<ITrigger | null> {
    return this.triggersService.create(createTriggerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list triggers' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The triggers list',
  })
  async findAll(): Promise<ITrigger[]> {
    return this.triggersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find trigger by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The trigger has been founded.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The trigger not found.',
  })
  async findOne(@Param('id') id: string): Promise<ITrigger | null> {
    return this.triggersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update the trigger' })
  @ApiBody({
    type: UpdateTriggerDto,
    description: 'Data for updating a triggers',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The trigger has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The trigger not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTriggerDto: UpdateTriggerDto,
  ): Promise<ITrigger | null> {
    return this.triggersService.update(id, updateTriggerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove the trigger' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The trigger has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The trigger not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.triggersService.remove(id);
  }
}
