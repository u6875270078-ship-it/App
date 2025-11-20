/**
 * Advanced Bot Detection System
 * Server-side behavioral analysis and scoring
 */

interface BotDetectionResult {
  isBot: boolean;
  score: number; // 0-100, higher = more likely a bot
  reasons: string[];
}

interface RequestFingerprint {
  userAgent: string;
  ip: string;
  headers: Record<string, string | string[] | undefined>;
}

// Track request patterns per IP
const ipRequestHistory = new Map<string, { timestamps: number[], paths: string[] }>();

// Cleanup old tracking data every 10 minutes
setInterval(() => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [ip, data] of Array.from(ipRequestHistory.entries())) {
    data.timestamps = data.timestamps.filter((t: number) => t > tenMinutesAgo);
    if (data.timestamps.length === 0) {
      ipRequestHistory.delete(ip);
    }
  }
}, 10 * 60 * 1000);

/**
 * Analyze request for bot characteristics
 */
export function detectBot(fingerprint: RequestFingerprint): BotDetectionResult {
  let score = 0;
  const reasons: string[] = [];

  const { userAgent, ip, headers } = fingerprint;

  // 1. User-Agent Analysis (0-30 points)
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i, /scrape/i,
    /headless/i, /phantom/i, /selenium/i, /puppeteer/i, /playwright/i,
    /curl/i, /wget/i, /python/i, /java(?!script)/i, /go-http/i, /perl/i,
    /facebookexternalhit/i, /whatsapp/i, /twitter/i, /telegram/i,
    /googlebot/i, /bingbot/i, /slackbot/i, /discordbot/i, /baiduspider/i,
    /yandex/i, /semrush/i, /ahref/i, /mj12bot/i, /dotbot/i
  ];

  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    score += 30;
    reasons.push('Known bot user-agent signature');
  }

  // Suspicious/generic user agents
  if (!userAgent || userAgent.length < 20) {
    score += 15;
    reasons.push('Missing or suspiciously short user-agent');
  }

  // 2. Missing Browser Features (0-25 points)
  const acceptHeader = headers['accept'] as string || '';
  const acceptLanguage = headers['accept-language'] as string || '';
  const acceptEncoding = headers['accept-encoding'] as string || '';

  if (!acceptHeader.includes('text/html')) {
    score += 10;
    reasons.push('No HTML acceptance in headers');
  }

  if (!acceptLanguage) {
    score += 8;
    reasons.push('Missing accept-language header');
  }

  if (!acceptEncoding) {
    score += 7;
    reasons.push('Missing accept-encoding header');
  }

  // 3. Suspicious Headers (0-20 points)
  const suspiciousHeaders = ['x-requested-with', 'x-forwarded-for', 'via', 'x-proxy-id'];
  const foundSuspicious = suspiciousHeaders.filter(h => headers[h]);
  
  if (foundSuspicious.length > 1) {
    score += 15;
    reasons.push('Multiple proxy/automation headers detected');
  }

  // 4. Request Pattern Analysis (0-25 points)
  let history = ipRequestHistory.get(ip);
  if (!history) {
    history = { timestamps: [], paths: [] };
    ipRequestHistory.set(ip, history);
  }

  const now = Date.now();
  history.timestamps.push(now);

  // Too many requests too fast (more than 5 requests in 5 seconds)
  const recentRequests = history.timestamps.filter(t => t > now - 5000);
  if (recentRequests.length > 5) {
    score += 20;
    reasons.push('Abnormally high request rate');
  }

  // Perfectly timed requests (exact intervals suggest automation)
  if (history.timestamps.length >= 3) {
    const intervals = [];
    for (let i = 1; i < history.timestamps.length; i++) {
      intervals.push(history.timestamps[i] - history.timestamps[i - 1]);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.map(i => Math.abs(i - avgInterval)).reduce((a, b) => a + b, 0) / intervals.length;
    
    // If variance is very low (< 100ms), requests are suspiciously uniform
    if (variance < 100 && intervals.length >= 3) {
      score += 15;
      reasons.push('Perfectly timed requests (automation detected)');
    }
  }

  // 5. Missing Common Browser Behavior
  const referer = headers['referer'] || headers['referrer'];
  const connection = headers['connection'];
  
  // First request should often have no referer (direct visit)
  // But subsequent form submissions should have one
  if (history.timestamps.length > 2 && !referer) {
    score += 5;
    reasons.push('Missing referer on subsequent requests');
  }

  // Determine final verdict
  const isBot = score >= 40; // Threshold: 40+ points = likely a bot

  return {
    isBot,
    score,
    reasons
  };
}

/**
 * Check if IP should be blocked based on previous violations
 */
export function shouldBlockIP(ip: string): boolean {
  const history = ipRequestHistory.get(ip);
  if (!history) return false;

  const oneMinuteAgo = Date.now() - 60 * 1000;
  const recentRequests = history.timestamps.filter(t => t > oneMinuteAgo);

  // Block if more than 20 requests in 1 minute
  return recentRequests.length > 20;
}
