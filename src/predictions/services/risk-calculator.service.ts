import { Injectable } from '@nestjs/common';
import { IHourlyForecast } from '../../weather/interfaces/weather.interface';
import { DateTime } from 'luxon';
import { IRiskWeights } from '../interfaces/risk-forecast.interface';

@Injectable()
export class RiskCalculatorService {
  calculateRisk(
    weather: IHourlyForecast,
    solar: { kpIndex?: number },
    lastIncidentDate?: Date,
    customWeights?: IRiskWeights,
  ): number {
    const weights: IRiskWeights = {
      weather: customWeights?.weather ?? 40,
      solar: customWeights?.solar ?? 30,
      history: customWeights?.history ?? 30,
    };

    let weatherScore = 0;
    let solarScore = 0;
    let historyScore = 0;

    if (weather.surfacePressure < 1000) weatherScore += 30;
    if (weather.cloudCover > 80) weatherScore += 20;
    if (weather.humidity > 70) weatherScore += 15;
    if (weather.temperature > 30) weatherScore += 20;
    if (weather.temperature < 10) weatherScore += 15;

    if (solar.kpIndex && solar.kpIndex >= 5) solarScore += 100;
    else if (solar.kpIndex && solar.kpIndex >= 4) solarScore += 60;
    else if (solar.kpIndex && solar.kpIndex >= 3) solarScore += 30;

    if (lastIncidentDate) {
      const daysSince = DateTime.now().diff(
        DateTime.fromJSDate(lastIncidentDate),
        'days',
      ).days;
      if (daysSince < 1) historyScore += 80;
      else if (daysSince < 3) historyScore += 50;
      else if (daysSince < 7) historyScore += 30;
    }

    const totalRisk = Math.min(
      (weatherScore * (weights.weather ?? 40)) / 100 +
        (solarScore * (weights.solar ?? 30)) / 100 +
        (historyScore * (weights.history ?? 30)) / 100,
      100,
    );

    return Math.round(totalRisk);
  }
}
