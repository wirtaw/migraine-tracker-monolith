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

export interface IHourlyForecastDetail {
  datetime: string;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  clouds: number;
  directRadiation: number;
  uvi: number;
  description: string;
}

export interface IHourlyForecast {
  time: Date;
  temperature: number;
  humidity: number;
  weatherCode: number;
}

export interface IDailyForecast {
  date: Date;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  precipitationSum: number;
}

export interface IForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: IHourlyForecast[];
  daily: IDailyForecast[];
}
