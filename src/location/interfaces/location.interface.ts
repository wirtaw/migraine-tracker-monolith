interface ISolar {
  kIndex: number | null;
  aIndex: number | null;
  flareProbability: number | null;
  datetime: string;
}

interface IForecast {
  description: string;
  temperature: number | null;
  pressure: number | null;
  humidity: number | null;
  windSpeed: number | null;
  clouds: number | null;
  uvi: number | null;
  datetime: string;
}

interface ISolarRadiation {
  uviIndex: number | null;
  ozone: number | null;
  solarFlux: number | null;
  sunsPotNumber: number | null;
  date: string;
}

export interface ILocationData {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  forecast: IForecast[] | [];
  solar: ISolar[] | [];
  solarRadiation: ISolarRadiation[] | [];
  datetimeAt: Date;
  incidentId: string | null;
}
