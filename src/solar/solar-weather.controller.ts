import { Controller, Get, Query } from '@nestjs/common';
import { SolarWeatherService } from './solar-weather.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  IRadiationTodayData,
  IGeophysicalWeatherData,
} from './interfaces/radiation.interface';
import { Req } from '@nestjs/common';
import { RequestWithUser } from '../auth/interfaces/auth.user.interface';

@ApiTags('solar')
@ApiBearerAuth('JWT-auth')
@Controller('solar')
export class SolarWeatherController {
  constructor(private readonly solarService: SolarWeatherService) {}

  @Get()
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Get solar radiation' })
  @ApiResponse({ status: 200, description: 'Solar radiation' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getRadiation(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Req() req: RequestWithUser,
  ): Promise<IRadiationTodayData[]> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.solarService.getRadiation(
      Number(latitude),
      Number(longitude),
      userId,
    );
  }

  @Get('geophysical/historical')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Get Geophysical Weather Data (Historical)' })
  @ApiResponse({ status: 200, description: 'Geophysical Weather' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getGeophysicalWeatherData(
    @Query('date') date: string,
    @Req() req: RequestWithUser,
  ): Promise<IGeophysicalWeatherData> {
    const userId = req?.user?.id || req?.session?.userId || '';
    return this.solarService.getGeophysicalWeatherData(date, userId);
  }
}
