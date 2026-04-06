export interface IRadiationTodayData {
  date: string;
  UVIndex: number;
  ozone: number;
  kpIndex?: number;
  aRunning?: number;
  Kp1?: number;
  Kp2?: number;
  Kp3?: number;
  Kp4?: number;
  Kp5?: number;
  Kp6?: number;
  Kp7?: number;
  Kp8?: number;
  ap1?: number;
  ap2?: number;
  ap3?: number;
  ap4?: number;
  ap5?: number;
  ap6?: number;
  ap7?: number;
  ap8?: number;
  solarFlux?: number;
  sunsPotNumber?: number;
}

export interface IStation {
  latitude: number;
  longitude: number;
  title: string;
  url: string;
}

export interface IRadiationData {
  CMF: number;
  date: string | undefined;
  ozone: number;
  cloud_Modified_DNA_damage_UV_dose_error: number;
  cloud_Modified_DNA_damage_UV_dose: number;
  cloud_Free_DNA_damage_UV_dose_error: number;
  cloud_Free_DNA_damage_UV_dose: number;
  cloud_Free_Erythemal_UV_dose_error: number;
  cloud_Free_Erythemal_UV_dose: number;
  cloud_Modified_Erythemal_UV_dose_error: number;
  cloud_Modified_Erythemal_UV_dose: number;
  cloud_Modified_Vitamin_D_UV_dose_error: number;
  cloud_Modified_Vitamin_D_UV_dose: number;
  cloud_Free_Erythemal_UV_index_error: number;
  cloud_Free_Erythemal_UV_index: number;
  cloud_Free_Vitamin_D_UV_dose_error: number;
  cloud_Free_Vitamin_D_UV_dose: number;
}

export interface IPlanetaryKindexDataItem {
  Kp: number;
  aRunning: number;
  date: string;
}

export interface IKPIData {
  AP: number;
  D: number;
  Kp1: number;
  Kp2: number;
  Kp3: number;
  Kp4: number;
  Kp5: number;
  Kp6: number;
  Kp7: number;
  Kp8: number;
  ap1: number;
  ap2: number;
  ap3: number;
  ap4: number;
  ap5: number;
  ap6: number;
  ap7: number;
  ap8: number;
  date: string;
  solarFlux: number;
  sunsPotNumber: number;
}

export interface NextWeather {
  kpIndex: {
    observed: string;
    expected: string;
    rationale: string;
  };
  solarRadiation: {
    rationale: string;
  };
  radioBlackout: {
    rationale: string;
  };
}

export interface IGeophysicalWeatherData {
  solarFlux: number;
  aIndex: number;
  kIndex: number;
  pastWeather: { level: string };
  nextWeather: NextWeather;
}

export interface INoaaRadiationItem {
  time_tag: string;
  Kp: number;
  a_running: number;
  station_count: number;
}
