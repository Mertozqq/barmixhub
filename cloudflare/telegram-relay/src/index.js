function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
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

  return new Intl.NumberFormat('ru-RU').format(numeric) + ' ₽';
}

function unauthorized() {
  return jsonResponse(
    {
      ok: false,
      error: 'unauthorized',
    },
    { status: 401 },
  );
}

function isAuthorized(request, env) {
  const header = request.headers.get('authorization') || '';
  const expected = String(env.RELAY_SHARED_TOKEN ?? '').trim();

  if (!expected) {
    return false;
  }

  return header === `Bearer ${expected}`;
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

  if (!String(order.orderId ?? '').trim()) {
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

async function sendTelegramMessage(payload, env) {
  const botToken = String(env.TELEGRAM_BOT_TOKEN ?? '').trim();
  const chatId = String(env.TELEGRAM_CHAT_ID ?? '').trim();

  if (!botToken || !chatId) {
    throw new Error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID.');
  }

  const messageBody = {
    chat_id: chatId,
    text: buildTelegramMessage(payload),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };

  const threadId = String(env.TELEGRAM_MESSAGE_THREAD_ID ?? '').trim();

  if (threadId) {
    messageBody.message_thread_id = Number(threadId);
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(messageBody),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    const details = data?.description || `HTTP ${response.status}`;
    throw new Error(`Telegram API error: ${details}`);
  }

  return data;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({
        ok: true,
        service: 'telegram-relay',
      });
    }

    if (request.method !== 'POST' || url.pathname !== '/') {
      return jsonResponse(
        {
          ok: false,
          error: 'not_found',
        },
        { status: 404 },
      );
    }

    if (!isAuthorized(request, env)) {
      return unauthorized();
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
      const telegramResponse = await sendTelegramMessage(payload, env);

      return jsonResponse({
        ok: true,
        event: payload.event,
        orderId: payload.order.orderId,
        telegramMessageId: telegramResponse?.result?.message_id ?? null,
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
  },
};
