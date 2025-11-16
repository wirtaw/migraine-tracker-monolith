export interface ISolar {
  kIndex?: number;
  aIndex?: number;
  flareProbability?: number;
  datetime: string;
}

export interface IForecast {
  description?: string;
  temperature?: number;
  pressure?: number;
  humidity?: number;
  windSpeed?: number;
  clouds?: number;
  uvi?: number;
  datetime: string;
}

export interface ISolarRadiation {
  uviIndex?: number;
  ozone?: number;
  solarFlux?: number;
  sunsPotNumber?: number;
  date: string;
}

export interface ILocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  forecast: IForecast[] | undefined;
  solar: ISolar[] | undefined;
  solarRadiation: ISolarRadiation[] | undefined;
  createdAt: Date;
  datetimeAt: Date;
  incidentId: string | undefined;
}
