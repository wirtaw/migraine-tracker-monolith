import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WeatherService } from '../../weather/weather.service';
import { SolarWeatherService } from '../../solar/solar-weather.service';
import { IncidentsService } from '../../incidents/incidents.service';
import { RiskCalculatorService } from './risk-calculator.service';
import {
  PredictionRule,
  PredictionRuleDocument,
} from '../schemas/prediction-rule.schema';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';
import { IRiskForecast } from '../interfaces/risk-forecast.interface';

interface CreatePredictionRuleDto {
  name: string;
  conditions: {
    source: 'weather' | 'solar';
    parameter: string; // e.g., temperature, pressure, humidity, kpIndex, uvIndex
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
  }[];
  alertMessage: string;
}

@Injectable()
export class PredictionsService {
  constructor(
    @InjectModel(PredictionRule.name)
    private ruleModel: Model<PredictionRuleDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private riskCalculator: RiskCalculatorService,
    private weatherService: WeatherService,
    private solarService: SolarWeatherService,
    private incidentsService: IncidentsService,
  ) {}

  async getRiskForecast(
    userId: string,
    latitude: number,
    longitude: number,
    encryptionKey: string,
    customWeights?: { weather?: number; solar?: number; history?: number },
  ): Promise<IRiskForecast> {
    const [weatherForecast, solarForecast] = await Promise.all([
      this.weatherService.getForecast(latitude, longitude, userId),
      this.solarService.getGeophysicalWeatherData(
        new Date().toISOString(),
        userId,
      ),
    ]);

    const incidents = await this.incidentsService.findAll(
      encryptionKey,
      userId,
    );
    const lastIncident = incidents.sort(
      (a, b) => b.datetimeAt.getTime() - a.datetimeAt.getTime(),
    )[0];

    const hourlyRisk = weatherForecast.hourly.map((hourly) => ({
      time: hourly.time,
      risk: this.riskCalculator.calculateRisk(
        hourly,
        { kpIndex: solarForecast.kIndex },
        lastIncident?.datetimeAt,
        customWeights,
      ),
    }));

    const dailyRisk = Math.round(
      hourlyRisk.reduce((sum, h) => sum + h.risk, 0) / hourlyRisk.length,
    );

    return {
      dailyRisk,
      hourlyRisk,
      factors: {
        weather: {
          temperature: weatherForecast.hourly[0].temperature,
          pressure: weatherForecast.hourly[0].surfacePressure,
          humidity: weatherForecast.hourly[0].humidity,
          uvIndex: weatherForecast.hourly[0].uvIndex,
        },
        solar: {
          kpIndex: solarForecast.kIndex,
          aIndex: solarForecast.aIndex,
        },
        history: {
          lastIncidentDate: lastIncident?.datetimeAt,
        },
      },
    };
  }

  async createRule(
    userId: string,
    dto: CreatePredictionRuleDto,
  ): Promise<PredictionRule> {
    const rule = new this.ruleModel({ ...dto, userId });
    return rule.save();
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getRules(userId: string): Promise<PredictionRule[]> {
    return this.ruleModel.find({ userId }).exec();
  }

  async markNotificationAsRead(
    userId: string,
    notificationId: string,
  ): Promise<void> {
    await this.notificationModel
      .findOneAndUpdate({ _id: notificationId, userId }, { isRead: true })
      .exec();
  }
}
