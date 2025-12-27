import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { OpenMeteoClient } from './open-meteo.client';

@Module({
  imports: [HttpModule, CacheModule.register(), ConfigModule],
  controllers: [WeatherController],
  providers: [WeatherService, OpenMeteoClient],
  exports: [WeatherService],
})
export class WeatherModule {}
