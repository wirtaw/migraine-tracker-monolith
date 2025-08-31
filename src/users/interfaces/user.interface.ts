interface IFetchDataErrors {
  forecast: string;
  magneticWeather: string;
}

export interface IUser {
  userId: string;
  supabaseId: string;
  longitude: string;
  latitude: string;
  email: string;
  birthDate: string;
  emailNotifications: boolean;
  dailySummary: boolean;
  personalHealthData: boolean;
  securitySetup: boolean;
  profileFilled: boolean;
  salt: string;
  encryptedSymmetricKey: string;
  fetchDataErrors: IFetchDataErrors;
  fetchMagneticWeather: boolean;
  fetchWeather: boolean;
}
