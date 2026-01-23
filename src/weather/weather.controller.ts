import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import {
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { IWeatherData } from './interfaces/weather.interface';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';
import { Req } from '@nestjs/common';

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
  async getForecast(
    @Query('latitude') lat: number,
    @Query('longitude') lon: number,
    @Req() req: RequestWithUser,
  ): Promise<IWeatherData | undefined> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.weatherService.getForecast(Number(lat), Number(lon), userId);
  }

  @Get('historical')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Get historical weather data' })
  @ApiResponse({ status: 200, description: 'Historical weather data' })
  async getHistorical(
    @Query('latitude') lat: number,
    @Query('longitude') lon: number,
    @Query('date') date: string,
    @Req() req: RequestWithUser,
  ): Promise<IWeatherData | undefined> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.weatherService.getHistorical(
      Number(lat),
      Number(lon),
      new Date(date),
      userId,
    );
  }
}
