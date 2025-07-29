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
  async findAll(): Promise<ITrigger[]> {
    return this.triggersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ITrigger | null> {
    return this.triggersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTriggerDto: UpdateTriggerDto,
  ): Promise<ITrigger | null> {
    return this.triggersService.update(id, updateTriggerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.triggersService.remove(id);
  }
}
