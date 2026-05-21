function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...init.headers,
    },
    status: init.status ?? 200,
  });
}

function textResponse(body, init = {}) {
  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      ...init.headers,
    },
    status: init.status ?? 200,
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function maskEmail(email) {
  const normalized = String(email ?? '').trim();

  if (!normalized.includes('@')) {
    return normalized || 'не указан';
  }

  const [name, domain] = normalized.split('@');

  if (!name) {
    return normalized;
  }

  if (name.length <= 2) {
    return `${name[0] || '*'}***@${domain}`;
  }

  return `${name.slice(0, 2)}***@${domain}`;
}

function formatPrice(amountRub) {
  const numeric = Number(amountRub ?? 0);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 'сумма не указана';
  }

  return `${new Intl.NumberFormat('ru-RU').format(numeric)} ₽`;
}

function toTrimmedString(value) {
  return String(value ?? '').trim();
}

function getAllowedTelegramIds(env) {
  return new Set(
    toTrimmedString(env.ALLOWED_TELEGRAM_IDS)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function isRelayAuthorized(request, env) {
  const header = request.headers.get('authorization') || '';
  const expected = toTrimmedString(env.RELAY_SHARED_TOKEN);

  if (!expected) {
    return false;
  }

  return header === `Bearer ${expected}`;
}

function isTelegramWebhookAuthorized(request, env) {
  const expected = toTrimmedString(env.TELEGRAM_WEBHOOK_SECRET);

  if (!expected) {
    return true;
  }

  const provided = request.headers.get('x-telegram-bot-api-secret-token') || '';
  return provided === expected;
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Payload must be an object.';
  }

  if (payload.event !== 'payment.succeeded') {
    return 'Unsupported event.';
  }

  const order = payload.order;

  if (!order || typeof order !== 'object') {
    return 'Order payload is required.';
  }

  if (!toTrimmedString(order.orderId)) {
    return 'OrderId is required.';
  }

  return '';
}

function buildTelegramMessage(payload) {
  const order = payload.order ?? {};
  const customer = order.customer ?? {};
  const lines = [
    'Новая оплата BarMix',
    '',
    `<b>Интенсив:</b> ${escapeHtml(order.title || 'Без названия')}`,
    `<b>Сумма:</b> ${escapeHtml(formatPrice(order.amountRub))}`,
    `<b>Провайдер:</b> ${escapeHtml(order.paymentProvider || 'не указан')}`,
    `<b>Статус:</b> ${escapeHtml(order.status || 'не указан')}`,
    '',
    `<b>Имя:</b> ${escapeHtml(customer.name || 'не указано')}`,
    `<b>Телефон:</b> ${escapeHtml(customer.phone || 'не указан')}`,
    `<b>Email:</b> ${escapeHtml(maskEmail(customer.email))}`,
    `<b>Промокод:</b> ${escapeHtml(order.promo || 'нет')}`,
    '',
    `<b>Order ID:</b> <code>${escapeHtml(order.orderId || '—')}</code>`,
    `<b>Payment ID:</b> <code>${escapeHtml(order.paymentId || '—')}</code>`,
  ];

  return lines.join('\n');
}

async function callTelegramApi(method, payload, env) {
  const botToken = toTrimmedString(env.TELEGRAM_BOT_TOKEN);

  if (!botToken) {
    throw new Error('Missing TELEGRAM_BOT_TOKEN.');
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    const details = data?.description || `HTTP ${response.status}`;
    throw new Error(`Telegram API error: ${details}`);
  }

  return data;
}

async function sendTelegramMessage(chatId, text, env) {
  return callTelegramApi(
    'sendMessage',
    {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    },
    env,
  );
}

async function notifyAllowedUsers(payload, env) {
  const allowedIds = [...getAllowedTelegramIds(env)];

  if (!allowedIds.length) {
    throw new Error('Missing ALLOWED_TELEGRAM_IDS.');
  }

  const text = buildTelegramMessage(payload);
  const results = [];

  for (const telegramId of allowedIds) {
    try {
      const response = await sendTelegramMessage(telegramId, text, env);

      results.push({
        telegramId,
        delivered: true,
        messageId: response?.result?.message_id ?? null,
      });
    } catch (error) {
      results.push({
        telegramId,
        delivered: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

function getTelegramContext(update) {
  const message = update?.message ?? update?.edited_message ?? null;

  if (!message) {
    return null;
  }

  const chatId = toTrimmedString(message.chat?.id);
  const userId = toTrimmedString(message.from?.id);
  const text = toTrimmedString(message.text);

  if (!chatId || !userId) {
    return null;
  }

  return {
    chatId,
    userId,
    text,
  };
}

async function handleTelegramWebhook(update, env) {
  const context = getTelegramContext(update);

  if (!context) {
    return textResponse('OK');
  }

  const allowedIds = getAllowedTelegramIds(env);
  const isAllowed = allowedIds.has(context.userId);

  if (context.text === '/start') {
    const text = isAllowed
      ? 'Доступ подтвержден. Уведомления о новых оплатах будут приходить в этот чат.'
      : 'Доступ к этому боту не выдан. Отправьте администратору команду /id, чтобы он добавил ваш Telegram ID в список разрешенных.';

    try {
      await sendTelegramMessage(context.chatId, text, env);
    } catch {
      return textResponse('OK');
    }

    return textResponse('OK');
  }

  if (context.text === '/id') {
    try {
      await sendTelegramMessage(
        context.chatId,
        `Ваш Telegram ID: <code>${escapeHtml(context.userId)}</code>`,
        env,
      );
    } catch {
      return textResponse('OK');
    }
  }

  if (!isAllowed) {
    return textResponse('OK');
  }

  return textResponse('OK');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({
        ok: true,
        service: 'telegram-relay',
        allowedUsersCount: [...getAllowedTelegramIds(env)].length,
      });
    }

    if (request.method === 'POST' && url.pathname === '/notify') {
      if (!isRelayAuthorized(request, env)) {
        return jsonResponse(
          {
            ok: false,
            error: 'unauthorized',
          },
          { status: 401 },
        );
      }

      let payload;

      try {
        payload = await request.json();
      } catch {
        return jsonResponse(
          {
            ok: false,
            error: 'invalid_json',
          },
          { status: 400 },
        );
      }

      const validationError = validatePayload(payload);

      if (validationError) {
        return jsonResponse(
          {
            ok: false,
            error: 'invalid_payload',
            details: validationError,
          },
          { status: 400 },
        );
      }

      try {
        const results = await notifyAllowedUsers(payload, env);
        const delivered = results.filter((item) => item.delivered).length;

        return jsonResponse({
          ok: true,
          event: payload.event,
          orderId: payload.order.orderId,
          delivered,
          total: results.length,
          results,
        });
      } catch (error) {
        return jsonResponse(
          {
            ok: false,
            error: 'telegram_send_failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 502 },
        );
      }
    }

    if (request.method === 'POST' && url.pathname === '/telegram/webhook') {
      if (!isTelegramWebhookAuthorized(request, env)) {
        return jsonResponse(
          {
            ok: false,
            error: 'unauthorized',
          },
          { status: 401 },
        );
      }

      let update;

      try {
        update = await request.json();
      } catch {
        return jsonResponse(
          {
            ok: false,
            error: 'invalid_json',
          },
          { status: 400 },
        );
      }

      return handleTelegramWebhook(update, env);
    }

    return jsonResponse(
      {
        ok: false,
        error: 'not_found',
      },
      { status: 404 },
    );
  },
};
