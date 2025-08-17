import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationService } from './locations.service';
import { LocationController } from './locations.controller';
import { Location, LocationSchema } from './schemas/locations.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Location.name, schema: LocationSchema },
    ]),
  ],
  controllers: [LocationController],
  providers: [LocationService],
})
export class LocationModule {}
