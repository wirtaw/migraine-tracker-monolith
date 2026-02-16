export interface IRiskForecast {
  dailyRisk: number;
  hourlyRisk: { time: Date; risk: number }[];
  factors: {
    weather: {
      temperature: number;
      pressure: number;
      humidity: number;
      uvIndex: number;
    };
    solar: {
      kpIndex?: number;
      aIndex?: number;
    };
    history: {
      lastIncidentDate?: Date;
    };
  };
}

export interface IRiskWeights {
  weather?: number;
  solar?: number;
  history?: number;
}
