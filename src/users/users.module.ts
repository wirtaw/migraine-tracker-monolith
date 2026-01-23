import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { Incident, IncidentSchema } from '../incidents/schemas/incident.schema';
import {
  Medication,
  MedicationSchema,
} from '../medications/schemas/medication.schema';
import { Symptom, SymptomSchema } from '../symptoms/schemas/symptom.schema';
import { Trigger, TriggerSchema } from '../triggers/schemas/trigger.schema';
import {
  Location,
  LocationSchema,
} from '../locations/schemas/locations.schema';
import {
  Weight,
  WeightSchema,
  Height,
  HeightSchema,
  BloodPressure,
  BloodPressureSchema,
  Sleep,
  SleepSchema,
} from '../health-logs/schemas/health-logs.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: Medication.name, schema: MedicationSchema },
      { name: Symptom.name, schema: SymptomSchema },
      { name: Trigger.name, schema: TriggerSchema },
      { name: Location.name, schema: LocationSchema },
      { name: Weight.name, schema: WeightSchema },
      { name: Height.name, schema: HeightSchema },
      { name: BloodPressure.name, schema: BloodPressureSchema },
      { name: Sleep.name, schema: SleepSchema },
    ]),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
