import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../stripe-webhook";
import { registerTwilioWebhooks } from "../twilio-webhooks";
import { registerResendWebhooks } from "../resend-webhooks";
import { registerScheduledRoutes } from "../scheduled-routes";
import { bootstrapAdminUser, seedProductCatalog, seedRegulatoryRules, getSupportTicketByRatingToken, updateSupportTicketRating, repairSchema, createContactSubmission } from "../db";
import { notifyOwner } from "./notification";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn("[Migrations] DATABASE_URL not set — skipping migrations");
    return;
  }
  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection(dbUrl);
    const db = drizzle(connection);
    const migrationsFolder = path.resolve(__dirname, "../drizzle");
    await migrate(db, { migrationsFolder });
    console.log("[Migrations] All pending migrations applied");
  } catch (err) {
    console.error("[Migrations] Migration failed:", err);
    throw err; // fatal — don't start a server with a broken schema
  } finally {
    await connection?.end();
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function validateEnv(): void {
  const required: Record<string, string> = {
    DATABASE_URL: process.env.DATABASE_URL ?? "",
    JWT_SECRET: process.env.JWT_SECRET ?? "",
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  };
  const optional: Record<string, string> = {
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  };

  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    console.error(`[Startup] FATAL — missing required env vars: ${missing.join(", ")}. Server cannot start safely.`);
    process.exit(1);
  }

  const missingOptional = Object.entries(optional).filter(([, v]) => !v).map(([k]) => k);
  if (missingOptional.length > 0) {
    console.warn(`[Startup] WARNING — missing optional env vars: ${missingOptional.join(", ")}. Some features will be disabled.`);
  }

  if (process.env.NODE_ENV === "production" && process.env.STRIPE_TEST_BYPASS === "true") {
    console.error("[Startup] FATAL — STRIPE_TEST_BYPASS=true is forbidden in production. Remove this Railway variable or set it to false.");
    process.exit(1);
  }
}

async function startServer() {
  validateEnv();

  // Run DB migrations before accepting any traffic
  await runMigrations();

  const app = express();
  const server = createServer(app);

  // Trust Railway / Render / Heroku reverse proxy so rate-limiter and
  // cookie secure flags work correctly with X-Forwarded-For headers.
  app.set("trust proxy", 1);

  // Redirect bare root domain to www canonical
  app.use((req, res, next) => {
    const host = req.headers.host || "";
    if (host === "minimorphstudios.net" || host === "minimorphstudios.net:443") {
      return res.redirect(301, `https://www.minimorphstudios.net${req.url}`);
    }
    next();
  });

  // ── Security headers ──
  app.use(helmet({
    contentSecurityPolicy: false, // Vite dev server needs inline scripts
    crossOriginEmbedderPolicy: false,
  }));

  // ── Rate limiting on public-facing endpoints ──
  const publicFormLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
  app.use("/api/trpc/repApplication.submitApplication", publicFormLimiter);
  app.use("/api/trpc/contactSubmissions.submit", publicFormLimiter);
  app.use("/api/trpc/leadGen.requestPublicAudit", publicFormLimiter);
  app.use("/api/trpc/orders.create", publicFormLimiter);

  // ── Stricter rate limiting on auth endpoints (brute-force protection) ──
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many authentication attempts, please try again later." },
  });
  app.use("/api/trpc/localAuth.register", authLimiter);
  app.use("/api/trpc/localAuth.login", authLimiter);

  // CRITICAL: Stripe webhook needs raw body BEFORE json parser
  registerStripeWebhook(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerTwilioWebhooks(app);
  registerResendWebhooks(app);
  registerScheduledRoutes(app);

  // Instagram OAuth — redirect to Instagram authorization page
  // Falls back gracefully when INSTAGRAM_CLIENT_ID is not configured
  app.get("/portal/connect-instagram", (req, res) => {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    if (!clientId) {
      return res.redirect("/portal?tab=setup&instagram=unavailable");
    }
    const redirectUri = `${req.protocol}://${req.get("host")}/portal/instagram-callback`;
    const scope = "user_profile,user_media";
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
    return res.redirect(302, authUrl);
  });

  app.get("/portal/instagram-callback", (req, res) => {
    // Placeholder — full token exchange requires server-side secret
    // When INSTAGRAM_CLIENT_SECRET is configured, implement token exchange here
    res.redirect("/portal?tab=setup&instagram=connected");
  });

  // Contact form submissions from generated customer sites (cross-origin)
  app.options("/api/contact-submit", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
  });
  app.post("/api/contact-submit", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    try {
      const { name, email, phone, message, businessName } = req.body as Record<string, string>;
      if (!name?.trim() || !email?.trim()) {
        return res.status(400).json({ success: false, error: "Name and email are required" });
      }
      const fullMessage = [message?.trim(), phone?.trim() ? `Phone: ${phone.trim()}` : ""].filter(Boolean).join("\n");
      await createContactSubmission({
        name: name.trim(),
        email: email.trim(),
        businessName: businessName?.trim() || undefined,
        message: fullMessage || undefined,
      });
      notifyOwner({
        title: `Contact Form: ${name.trim()}`,
        content: `Business: ${businessName || "N/A"}\nEmail: ${email}\n${phone ? `Phone: ${phone}\n` : ""}${message ? `Message: ${message}` : ""}`,
      }).catch(() => {});
      return res.json({ success: true });
    } catch (err) {
      console.error("[ContactSubmit]", err);
      return res.status(500).json({ success: false, error: "Server error" });
    }
  });

  // Public support rating endpoint — linked from resolution emails
  app.get("/api/rate-support", async (req, res) => {
    const ticketId = parseInt(String(req.query.ticketId));
    const rating = parseInt(String(req.query.rating));
    const token = String(req.query.token ?? "");
    if (!ticketId || !token || rating < 1 || rating > 5) {
      return res.status(400).send("<p>Invalid rating link.</p>");
    }
    const ticket = await getSupportTicketByRatingToken(token);
    if (!ticket || ticket.id !== ticketId) {
      return res.status(404).send("<p>This rating link has expired or is invalid.</p>");
    }
    await updateSupportTicketRating(ticketId, rating);
    return res.send(`<!DOCTYPE html><html><head><title>Thanks!</title></head><body style="font-family:sans-serif;text-align:center;padding:60px;"><h2>Thanks for your feedback!</h2><p>You rated your support experience ${"⭐".repeat(rating)}.</p><p><a href="/">Back to MiniMorph Studios</a></p></body></html>`);
  });

  // Health check — used by Railway and uptime monitors
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", ts: Date.now() });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ path, error }) {
        console.error(`[tRPC] ${path} →`, error.message, error.cause ?? "");
      },
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Repair any schema gaps caused by __drizzle_migrations state drift (idempotent)
  await repairSchema();
  // Bootstrap admin user from env vars — awaited so account exists before first request
  await bootstrapAdminUser();
  // Seed product catalog with default pricing (idempotent upsert)
  await seedProductCatalog().catch(err => console.error("[Startup] Product catalog seed failed:", err));
  // Seed regulatory rules (idempotent — gated by regulatory_rules_v1 flag)
  await seedRegulatoryRules().catch(err => console.error("[Startup] Regulatory rules seed failed:", err));
  // Catalog health check — logs any addons missing pitch scripts
  try {
    const { listProductCatalog } = await import("../db");
    const catalogItems = await listProductCatalog(true);
    const withPitch = catalogItems.filter((p: any) => !p.isFree && p.pitchScript);
    const withoutPitch = catalogItems.filter((p: any) => !p.isFree && !p.pitchScript && p.category === "addon");
    console.log(
      `[ProductCatalog] Health check: ${withPitch.length} addons with pitch scripts,`,
      withoutPitch.length > 0
        ? `WARN: ${withoutPitch.length} missing pitch scripts: ${withoutPitch.map((p: any) => p.productKey).join(", ")}`
        : "all pitch scripts present",
    );
  } catch (err) {
    console.error("[ProductCatalog] Health check failed:", err);
  }
  // Sync product catalog to Stripe (non-fatal — server continues if Stripe is unavailable)
  import("../services/stripePriceSync").then(({ syncAllProductsToStripe }) =>
    syncAllProductsToStripe().then(result => {
      console.log(`[Startup] Stripe sync: ${result.synced} synced, ${result.failed} failed`);
      if (result.errors.length > 0) result.errors.forEach(e => console.warn("[Startup] Stripe sync error:", e));
    })
  ).catch(err => console.error("[Startup] Stripe sync failed:", err));

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Internal setInterval scheduler — disabled by default in production.
    // Use /api/scheduled/* endpoints with external cron instead.
    if (process.env.ENABLE_INTERNAL_SCHEDULER === "true") {
      import("../services/leadGenScheduler").then(({ startLeadGenScheduler }) => {
        console.log("[LeadGen Scheduler] ENABLE_INTERNAL_SCHEDULER=true — starting internal setInterval scheduler (dev only)");
        startLeadGenScheduler();
      }).catch((err) => {
        console.error("[LeadGen Scheduler] Failed to start:", err);
      });
    } else {
      console.log("[LeadGen Scheduler] Internal scheduler disabled. Use /api/scheduled/* endpoints with external cron.");
    }
  });
}

startServer().catch(console.error);
