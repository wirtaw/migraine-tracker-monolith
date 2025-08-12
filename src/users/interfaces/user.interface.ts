interface IFetchDataErrors {
  forecast: string;
  magneticWeather: string;
}

export interface IUser {
  userId: string;
  longitude: string;
  latitude: string;
  birthDate: string;
  emailNotifications: boolean;
  dailySummary: boolean;
  personalHealthData: boolean;
  securitySetup: boolean;
  profileFilled: boolean;
  salt: string;
  key: string;
  fetchDataErrors: IFetchDataErrors;
  fetchMagneticWeather: boolean;
  fetchWeather: boolean;
}
