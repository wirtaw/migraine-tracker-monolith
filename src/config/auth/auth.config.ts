export interface AuthConfig {
  supaBaseUrl: string;
  supaBaseAnonKey: string;
}

export default (): AuthConfig => ({
  supaBaseUrl: process.env.SUPBASE_URL ? process.env.SUPBASE_URL : '',
  supaBaseAnonKey: process.env.SUPBASE_KEY ? process.env.SUPBASE_KEY : '',
});
