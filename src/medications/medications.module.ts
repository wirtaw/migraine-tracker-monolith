import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicationsService } from './medications.service';
import { MedicationsController } from './medications.controller';
import { Medication, MedicationSchema } from './schemas/medication.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Medication.name, schema: MedicationSchema },
    ]),
    AuthModule,
  ],
  controllers: [MedicationsController],
  providers: [MedicationsService],
})
export class MedicationsModule {}
