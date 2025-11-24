export default () => ({
  apis: {
    temis: process.env.TEMIS_BASE_URL || 'https://www.temis.nl/uvradiation',
    gfz: process.env.GFZ_BASE_URL || 'https://www-app3.gfz-potsdam.de',
    noaa: process.env.NOAA_BASE_URL || 'https://services.swpc.noaa.gov',
    openMeteo: process.env.OPEN_METEO_URL || 'https://api.open-meteo.com',
  },
  caching: {
    weatherTtl: 1800000, // 30 minutes
    solarTtl: 3600000, // 1 hour
  },
});

export interface IntegrationConfig {
  apis: {
    temis: string;
    gfz: string;
    noaa: string;
    openMeteo: string;
  };
  caching: {
    weatherTtl: number;
    solarTtl: number;
  };
}
