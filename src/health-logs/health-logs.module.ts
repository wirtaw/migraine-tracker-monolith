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
} from './schemas/health-logs.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Weight.name, schema: WeightSchema },
      { name: Height.name, schema: HeightSchema },
      { name: BloodPressure.name, schema: BloodPressureSchema },
      { name: Sleep.name, schema: SleepSchema },
    ]),
  ],
  controllers: [HealthLogsController],
  providers: [HealthLogsService],
})
export class HealthLogsModule {}
