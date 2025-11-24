import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { TestController } from './test.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import appConfig, { getEnvFilePaths } from './config/index';
import { MongooseConfigService } from './config/database/mongoose.config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/users.module';
import { IncidentsModule } from './incidents/incidents.module';
import { TriggersModule } from './triggers/triggers.module';
import { SymptomsModule } from './symptoms/symptoms.module';
import { MedicationsModule } from './medications/medications.module';
import { LocationsModule } from './locations/locations.module';
import { HealthLogsModule } from './health-logs/health-logs.module';
import { WeatherModule } from './weather/weather.module';
import { SolarWeatherModule } from './solar/solar-weather.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: getEnvFilePaths(),
      cache: true,
    }),
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),
    AuthModule,
    UserModule,
    IncidentsModule,
    TriggersModule,
    SymptomsModule,
    MedicationsModule,
    LocationsModule,
    HealthLogsModule,
    WeatherModule,
    SolarWeatherModule,
  ],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule {}
