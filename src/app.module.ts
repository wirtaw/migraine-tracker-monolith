import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import appConfig, { getEnvFilePaths } from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IncidentsModule } from './incidents/incidents.module';
import { TriggersModule } from './triggers/triggers.module';
import { SymptomsModule } from './symptoms/symptoms.module';
import { MedicationsModule } from './medications/medications.module';
import { LocationModule } from './location/location.module';
import { HealthLogsModule } from './health-logs/health-logs.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: getEnvFilePaths(),
      cache: true,
    }),
    AuthModule,
    UsersModule,
    IncidentsModule,
    TriggersModule,
    SymptomsModule,
    MedicationsModule,
    LocationModule,
    HealthLogsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
