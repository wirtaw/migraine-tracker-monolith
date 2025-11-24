export interface IWeatherData {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  feels_like?: number;
  wind_speed_10m?: number;
  clouds?: number;
  uvi?: number;
  description: string;
  icon: string; // Mapped from OpenMeteo weather code
  alerts: Array<{
    description: string;
    start: number;
    end: number;
    event: string;
    sender_name: string;
  }>;
}

export interface IOpenMeteoData {
  clouds: number;
  datetime: string;
  description: string;
  directRadiation: number;
  humidity: number;
  pressure: number;
  temperature: number;
  windSpeed: number;
  uvi: number;
}
