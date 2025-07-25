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
import { HealthLogsService } from './health-logs.service';
import { CreateHealthLogDto } from './dto/create-health-log.dto';
import { UpdateHealthLogDto } from './dto/update-health-log.dto';

@ApiTags('health-logs')
@ApiBearerAuth('JWT-auth')
@Controller('health-logs')
export class HealthLogsController {
  constructor(private readonly healthLogsService: HealthLogsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new health-log' })
  @ApiBody({
    type: CreateHealthLogDto,
    description: 'Data for creating a new health-log',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The health-log has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  create(@Body() createHealthLogDto: CreateHealthLogDto) {
    return this.healthLogsService.create(createHealthLogDto);
  }

  @Get()
  findAll() {
    return this.healthLogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.healthLogsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateHealthLogDto: UpdateHealthLogDto,
  ) {
    return this.healthLogsService.update(+id, updateHealthLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.healthLogsService.remove(+id);
  }
}
