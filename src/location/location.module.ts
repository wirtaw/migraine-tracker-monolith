import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { ForecastService } from './forecast/forecast.service';
import { SolarService } from './solar/solar.service';

@Module({
  controllers: [LocationController],
  providers: [LocationService, ForecastService, SolarService],
})
export class LocationModule {}
