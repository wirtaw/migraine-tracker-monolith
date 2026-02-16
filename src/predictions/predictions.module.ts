import { Module } from '@nestjs/common';
import { PredictionsService } from './services/predictions.service';
import { PredictionsController } from './controllers/predictions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PredictionRule,
  PredictionRuleSchema,
} from './schemas/prediction-rule.schema';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { WeatherModule } from '../weather/weather.module';
import { SolarWeatherModule } from '../solar/solar-weather.module';
import { UserModule } from '../users/users.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { RiskCalculatorService } from './services/risk-calculator.service';
import { PatternGuardianService } from './services/pattern-guardian.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PredictionRule.name, schema: PredictionRuleSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    ScheduleModule.forRoot(),
    WeatherModule,
    SolarWeatherModule,
    UserModule,
    IncidentsModule,
  ],
  controllers: [PredictionsController],
  providers: [
    PredictionsService,
    RiskCalculatorService,
    PatternGuardianService,
  ],
  exports: [PredictionsService],
})
export class PredictionsModule {}
