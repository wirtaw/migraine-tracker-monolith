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

export interface IRadiationMappedData {
  date: string;
  ozone: number;
  solarFlux: number;
  sunsPotNumber: number;
  uviIndex?: number; // legacy code had 'uviIndex' in map but 'UVIndex' in interface. 'uviIndex' used in controller map.
  uvIndex?: number; // checking schema, it has uvIndex.
}

export interface IPlanetaryKindexMappedData {
  aIndex: number;
  datetime: string;
  flareProbability: number | null;
  kIndex: number;
}

export interface ISummaryResponse {
  datetimeAt: string;
  id?: number;
  incidentId?: number;
  forecast: IOpenMeteoData[] | [];
  latitude: number;
  longitude: number;
  solarRadiation: IRadiationMappedData[] | [];
  solar: IPlanetaryKindexMappedData[] | [];
  userId: string;
}
