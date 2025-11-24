import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('weather')
@ApiBearerAuth('JWT-auth')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Get weather forecast' })
  @ApiResponse({ status: 200, description: 'Weather forecast' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getForecast(@Query('lat') lat: number, @Query('lon') lon: number) {
    return this.weatherService.getForecast(Number(lat), Number(lon));
  }
}
