import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TriggersService } from './triggers.service';
import { TriggersController } from './triggers.controller';
import { Trigger, TriggerSchema } from './schemas/trigger.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Trigger.name, schema: TriggerSchema }]),
    AuthModule,
  ],
  controllers: [TriggersController],
  providers: [TriggersService],
})
export class TriggersModule {}
