import { Module } from '@nestjs/common';
import { HealthLogsService } from './health-logs.service';
import { HealthLogsController } from './health-logs.controller';

@Module({
  controllers: [HealthLogsController],
  providers: [HealthLogsService],
})
export class HealthLogsModule {}
