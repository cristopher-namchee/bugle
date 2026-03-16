declare namespace NodeJS {
  interface ProcessEnv {
    DAILY_GOOGLE_SPACE: string;
    WEEKLY_GOOGLE_SPACE: string;
    SCRIPT_URL: string;
    SHIFT_URL: string;
    GH_TOKEN: string;

    SERVICE_ACCOUNT_EMAIL: string;
    SERVICE_ACCOUNT_PRIVATE_KEY: string;
  }
}
