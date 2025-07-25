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
import { TriggersService } from './triggers.service';
import { CreateTriggerDto } from './dto/create-trigger.dto';
import { UpdateTriggerDto } from './dto/update-trigger.dto';

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
  create(@Body() createTriggerDto: CreateTriggerDto) {
    return this.triggersService.create(createTriggerDto);
  }

  @Get()
  findAll() {
    return this.triggersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.triggersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTriggerDto: UpdateTriggerDto) {
    return this.triggersService.update(+id, updateTriggerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.triggersService.remove(+id);
  }
}
