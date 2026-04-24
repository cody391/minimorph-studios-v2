export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Communications platform
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
  twilioTwimlAppSid: process.env.TWILIO_TWIML_APP_SID ?? "",
  resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET ?? "",
  ownerName: process.env.OWNER_NAME ?? "",
  ownerPhoneNumber: process.env.OWNER_PHONE_NUMBER ?? "",
  // Web push VAPID keys (generated at startup if not set)
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  // Contact enrichment APIs
  apolloApiKey: process.env.APOLLO_API_KEY ?? "",
  hunterApiKey: process.env.HUNTER_API_KEY ?? "",
  // X (Twitter) API
  xApiKey: process.env.X_API_KEY ?? "",
  xApiSecret: process.env.X_API_SECRET ?? "",
  xAccessToken: process.env.X_ACCESS_TOKEN ?? "",
  xAccessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET ?? "",
  xBearerToken: process.env.X_BEARER_TOKEN ?? "",
  // Scheduler
  schedulerSecret: process.env.SCHEDULER_SECRET ?? "",
  enableInternalScheduler: process.env.ENABLE_INTERNAL_SCHEDULER === "true",
};
