import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { SolarWeatherController } from './solar-weather.controller';
import { SolarWeatherService } from './solar-weather.service';
import { TemisClient } from './temis.client';
import { NoaaClient } from './noaa.client';
import { GfzClient } from './gfz.client';

@Module({
  imports: [HttpModule, CacheModule.register(), ConfigModule],
  controllers: [SolarWeatherController],
  providers: [SolarWeatherService, TemisClient, NoaaClient, GfzClient],
  exports: [SolarWeatherService],
})
export class SolarWeatherModule {}
