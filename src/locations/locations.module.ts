import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { Location, LocationSchema } from './schemas/locations.schema';
import { AuthModule } from '../auth/auth.module';
import { WeatherModule } from 'src/weather/weather.module';
import { SolarWeatherModule } from 'src/solar/solar-weather.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Location.name, schema: LocationSchema },
    ]),
    AuthModule,
    WeatherModule,
    SolarWeatherModule,
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
})
export class LocationsModule {}
