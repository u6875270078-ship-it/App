import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startTelegramBot } from "./telegram-bot";
import helmet from "helmet";

const app = express();

// Global error handler for uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit in production, just log
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
  }
}
// Security headers using Helmet - MUST be before other middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Vite in dev mode and React
        "'unsafe-eval'",   // Required for Vite HMR in dev
        "https://www.google.com",
        "https://www.gstatic.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and Tailwind
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://www.google.com",
        "wss://",          // WebSocket for Vite HMR
        "ws://"            // WebSocket for Vite HMR
      ],
      frameSrc: ["https://www.google.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for development
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Additional security: Permissions Policy
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );
  next();
});

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    log('Starting server initialization...', 'express');
    
    const server = await registerRoutes(app);
    log('Routes registered successfully', 'express');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error('Error handler caught:', err);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      log('Setting up Vite in development mode...', 'express');
      await setupVite(app, server);
    } else {
      log('Setting up static file serving in production mode...', 'express');
      try {
        serveStatic(app);
        log('Static files configured successfully', 'express');
      } catch (staticError) {
        console.error('Failed to setup static files:', staticError);
        throw staticError;
      }
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    const host = process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0';
    
    server.listen({
      port,
      host,
      reusePort: process.platform !== 'win32',
    }, () => {
      log(`serving on port ${port}`);
      log(`Environment: ${app.get("env")}`, 'express');
      
      // Start Telegram bot for remote control (optional, won't crash if it fails)
      setTimeout(() => {
        try {
          startTelegramBot();
          log('Telegram bot initialization attempted', 'express');
        } catch (botError) {
          console.error('Failed to start Telegram bot (non-fatal):', botError);
          log('Telegram bot failed to start, continuing without it', 'express');
        }
      }, 2000);
    });
  } catch (error) {
    console.error('Fatal error during server initialization:', error);
    log(`Server failed to start: ${error}`, 'express');
    process.exit(1);
  }
})();
