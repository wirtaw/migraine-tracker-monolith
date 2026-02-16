import { IRiskWeights } from '../interfaces/risk-forecast.interface';

export const defaultRiskWeights: IRiskWeights = {
  weather: 0.4,
  solar: 0.3,
  history: 0.3,
};
