import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../stripe-webhook";
import { registerTwilioWebhooks } from "../twilio-webhooks";
import { registerResendWebhooks } from "../resend-webhooks";
import { registerScheduledRoutes } from "../scheduled-routes";

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

async function startServer() {
  const app = express();
  const server = createServer(app);

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
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
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
