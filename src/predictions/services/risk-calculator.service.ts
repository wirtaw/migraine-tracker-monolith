import { Injectable } from '@nestjs/common';
import { IHourlyForecast } from '../../weather/interfaces/weather.interface';
import { IRiskWeights } from '../interfaces/risk-forecast.interface';
import { defaultRiskWeights } from '../constants/risks';

@Injectable()
export class RiskCalculatorService {
  /**
   * Calculates the migraine risk score (0-100) based on weather, solar data, and history.
   */
  calculateRisk(
    weather: IHourlyForecast,
    solar: { kpIndex?: number },
    lastIncident?: Date,
    weights: IRiskWeights = defaultRiskWeights,
  ): number {
    // 1. Define Weights
    const w = weights;

    // 2. Calculate Weather Risk (0-100)
    let weatherRisk = 0;
    // Pressure check (Standard sea level is ~1013 hPa)
    if (weather.surfacePressure && weather.surfacePressure < 1000)
      weatherRisk += 30;

    // Cloud cover check
    if (weather.cloudCover && weather.cloudCover > 80) weatherRisk += 20;

    // Humidity check
    if (weather.humidity && weather.humidity > 70) weatherRisk += 20;

    // Temperature extremes
    if (
      weather.temperature &&
      (weather.temperature > 30 || weather.temperature < 10)
    ) {
      weatherRisk += 30;
    }

    weatherRisk = Math.min(weatherRisk, 100);

    // 3. Calculate Solar Risk (0-100)
    let solarRisk = 0;
    if (solar && typeof solar.kpIndex === 'number') {
      // Kp index ranges 0-9.
      solarRisk = (solar.kpIndex / 9) * 100;
    }

    // 4. Calculate History Risk (0-100)
    // Linear decay over 72 hours from the last incident
    let historyRisk = 0;
    if (lastIncident) {
      const now = new Date();
      const diffMs = now.getTime() - lastIncident.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours >= 0 && diffHours <= 72) {
        historyRisk = 100 * (1 - diffHours / 72);
      }
    }

    // 5. Weighted Total
    const totalRisk =
      weatherRisk * w.weather + solarRisk * w.solar + historyRisk * w.history;

    // Cap at 100 and round
    return Math.min(Math.round(totalRisk), 100);
  }
}
