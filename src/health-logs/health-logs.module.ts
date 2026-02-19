import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthLogsService } from './health-logs.service';
import { HealthLogsController } from './health-logs.controller';
import {
  Weight,
  WeightSchema,
  Height,
  HeightSchema,
  BloodPressure,
  BloodPressureSchema,
  Sleep,
  SleepSchema,
  Water,
  WaterSchema,
} from './schemas/health-logs.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Weight.name, schema: WeightSchema },
      { name: Height.name, schema: HeightSchema },
      { name: BloodPressure.name, schema: BloodPressureSchema },
      { name: Sleep.name, schema: SleepSchema },
      { name: Water.name, schema: WaterSchema },
    ]),
    AuthModule,
  ],
  controllers: [HealthLogsController],
  providers: [HealthLogsService],
})
export class HealthLogsModule {}
