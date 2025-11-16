import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SymptomsService } from './symptoms.service';
import { SymptomsController } from './symptoms.controller';
import { Symptom, SymptomSchema } from './schemas/symptom.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Symptom.name, schema: SymptomSchema }]),
    AuthModule,
  ],
  controllers: [SymptomsController],
  providers: [SymptomsService],
})
export class SymptomsModule {}
