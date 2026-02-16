import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { WeatherService } from '../../weather/weather.service';
import { SolarWeatherService } from '../../solar/solar-weather.service';
import { UserService } from '../../users/users.service';
import {
  PredictionRule,
  PredictionRuleDocument,
  PredictionRuleCondition,
} from '../schemas/prediction-rule.schema';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';
import { IForecastResponse } from '../../weather/interfaces/weather.interface';
import { IGeophysicalWeatherData } from '../../solar/interfaces/radiation.interface';
import { OperatorEnum } from '../enums/operator.enum';

@Injectable()
export class PatternGuardianService {
  constructor(
    @InjectModel(PredictionRule.name)
    private ruleModel: Model<PredictionRuleDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private weatherService: WeatherService,
    private solarService: SolarWeatherService,
    private userService: UserService,
  ) {}

  @Cron('0 */6 * * *')
  async evaluateRules(): Promise<void> {
    const enabledRules = await this.ruleModel.find({ isEnabled: true }).exec();
    if (enabledRules.length === 0) return;

    const users = await this.userService.findAll();
    const userMap = new Map<string, { latitude: number; longitude: number }>();

    for (const user of users) {
      userMap.set(user.userId, {
        latitude: parseFloat(user.latitude),
        longitude: parseFloat(user.longitude),
      });
    }

    const locationGroups = new Map<string, string[]>();

    for (const rule of enabledRules) {
      const locationKey = this.getLocationKey(rule.userId, userMap);
      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, []);
      }
      locationGroups.get(locationKey)!.push(rule.userId);
    }

    for (const [locationKey, userIds] of locationGroups) {
      const { latitude, longitude } = JSON.parse(locationKey) as {
        latitude: string;
        longitude: string;
      };

      const latitudeNum = parseFloat(latitude);
      if (isNaN(latitudeNum)) {
        Logger.error('Invalid latitude in locationKey:', locationKey);
        continue;
      }

      const longitudeNum = parseFloat(longitude);
      if (isNaN(longitudeNum)) {
        Logger.error('Invalid longitude in locationKey:', locationKey);
        continue;
      }

      const [weatherForecast, solarForecast] = await Promise.all([
        this.weatherService.getForecast(latitudeNum, longitudeNum),
        this.solarService.getGeophysicalWeatherData(new Date().toISOString()),
      ]);

      const relevantRules = enabledRules.filter((r) =>
        userIds.includes(r.userId),
      );

      await this.evaluateRulesForLocation(
        relevantRules,
        weatherForecast,
        solarForecast,
      );
    }
  }

  private getLocationKey(
    userId: string,
    userMap: Map<string, { latitude: number; longitude: number }>,
  ): string {
    const userLocation = userMap.get(userId);
    if (!userLocation) {
      const defaultLocation = { latitude: 52.52, longitude: 13.41 };
      return JSON.stringify(defaultLocation);
    }
    return JSON.stringify({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    });
  }

  private async evaluateRulesForLocation(
    rules: PredictionRuleDocument[],
    weather: IForecastResponse,
    solar: IGeophysicalWeatherData,
  ): Promise<void> {
    for (const rule of rules) {
      const matchResult = this.evaluateRule(rule, weather, solar);

      if (matchResult.matched) {
        await this.notificationModel.create({
          userId: rule.userId,
          type: 'pattern-match',
          message: rule.alertMessage,
          ruleId: rule._id?.toString(),
        });
      }
    }
  }

  private evaluateRule(
    rule: PredictionRuleDocument,
    weather: IForecastResponse,
    solar: IGeophysicalWeatherData,
  ): { matched: boolean; details: string[] } {
    const details: string[] = [];
    let allMatched = true;

    for (const condition of rule.conditions) {
      const matched = this.evaluateCondition(condition, weather, solar);
      details.push(
        `${condition.source}.${condition.parameter} ${condition.operator} ${condition.value}: ${matched}`,
      );

      if (!matched) allMatched = false;
    }

    return { matched: allMatched, details };
  }

  private evaluateCondition(
    condition: PredictionRuleCondition,
    weather: IForecastResponse,
    solar: IGeophysicalWeatherData,
  ): boolean {
    const value = this.getValue(condition, weather, solar);

    const operator = condition.operator;

    switch (operator) {
      case OperatorEnum.GT:
        return value > condition.value;
      case OperatorEnum.LT:
        return value < condition.value;
      case OperatorEnum.EQ:
        return value === condition.value;
      case OperatorEnum.GTE:
        return value >= condition.value;
      case OperatorEnum.LTE:
        return value <= condition.value;
      default:
        return false;
    }
  }

  private getValue(
    condition: PredictionRuleCondition,
    weather: IForecastResponse,
    solar: IGeophysicalWeatherData,
  ): number {
    const hourly = weather.hourly[0];
    if (!hourly) return 0;

    if (condition.source === 'weather') {
      const param = condition.parameter;
      if (param === 'temperature') {
        return hourly.temperature;
      } else if (param === 'pressure') {
        return hourly.surfacePressure;
      } else if (param === 'humidity') {
        return hourly.humidity;
      } else if (param === 'uvIndex') {
        return hourly.uvIndex;
      }
      return 0;
    } else if (condition.source === 'solar') {
      const param = condition.parameter;
      if (param === 'kpIndex') {
        return solar.kIndex || 0;
      } else if (param === 'aIndex') {
        return solar.aIndex || 0;
      }
      return 0;
    }
    return 0;
  }
}
