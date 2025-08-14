import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig, { getEnvFilePaths } from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/users.module';
import { IncidentsModule } from './incidents/incidents.module';
import { TriggersModule } from './triggers/triggers.module';
import { SymptomsModule } from './symptoms/symptoms.module';
import { MedicationsModule } from './medications/medications.module';
import { LocationModule } from './location/location.module';
import { HealthLogsModule } from './health-logs/health-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: getEnvFilePaths(),
      cache: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('app.mongoDbUri'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    IncidentsModule,
    TriggersModule,
    SymptomsModule,
    MedicationsModule,
    LocationModule,
    HealthLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
