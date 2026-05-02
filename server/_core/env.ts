export const ENV = {
  // appId is embedded in every JWT — must be non-empty or all session verifications fail
  appId: process.env.VITE_APP_ID || "minimorph-studios",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Forge/Manus legacy — only needed if still running on Manus platform
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Public app URL — used in emails, payment links, webhook callbacks
  appUrl: process.env.APP_URL || process.env.VITE_APP_URL || "",
  // Admin credentials for self-hosted deployments (bypasses Manus OAuth)
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminName: process.env.ADMIN_NAME || "Admin",
  // AI — Anthropic
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  // Storage — AWS S3
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  awsRegion: process.env.AWS_REGION || "us-east-1",
  awsS3Bucket: process.env.AWS_S3_BUCKET ?? "",
  // Google Maps direct API key
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  // Communications platform
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL || "hello@minimorphstudios.net",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
  twilioTwimlAppSid: process.env.TWILIO_TWIML_APP_SID ?? "",
  resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET ?? "",
  ownerName: process.env.OWNER_NAME ?? "",
  ownerPhoneNumber: process.env.OWNER_PHONE_NUMBER ?? "",
  // Web push VAPID keys
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
  // Namecheap domain registrar
  namecheapApiKey: process.env.NAMECHEAP_API_KEY ?? "",
  namecheapApiUser: process.env.NAMECHEAP_API_USER ?? "",
  namecheapClientIp: process.env.NAMECHEAP_CLIENT_IP ?? "",
  // Stripe — prefer CUSTOM_* keys (Connect-enabled account) over built-in ones
  stripeSecretKey: process.env.CUSTOM_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || "",
  stripePublishableKey: process.env.CUSTOM_STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  // Cloudflare — Pages deployment for customer sites
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN ?? "",
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
  minimorphSitesDomain: process.env.MINIMORPH_SITES_DOMAIN ?? "minimorphsites.com",
};
