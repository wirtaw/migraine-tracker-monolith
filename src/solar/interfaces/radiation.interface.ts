export interface IRadiationTodayData {
  date: string; // ISO Date string
  UVIndex: number;
  ozone: number;
  kpIndex?: number;
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
