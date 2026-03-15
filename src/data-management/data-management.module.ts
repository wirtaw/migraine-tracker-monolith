import { Module } from '@nestjs/common';
import { DataManagementService } from './data-management.service';
import { DataManagementController } from './data-management.controller';

@Module({
  providers: [DataManagementService],
  controllers: [DataManagementController],
})
export class DataManagementModule {}
