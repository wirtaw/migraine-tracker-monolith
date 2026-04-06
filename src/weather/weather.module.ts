import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { OpenMeteoClient } from './open-meteo.client';
import { UserModule } from '../users/users.module';

@Module({
  imports: [CacheModule.register(), ConfigModule, UserModule],
  controllers: [WeatherController],
  providers: [WeatherService, OpenMeteoClient],
  exports: [WeatherService],
})
export class WeatherModule {}
