import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { Incident, IncidentSchema } from './schemas/incident.schema';
import { AuthModule } from '../auth/auth.module';
import { TriggersModule } from '../triggers/triggers.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Incident.name, schema: IncidentSchema },
    ]),
    AuthModule,
    TriggersModule,
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
