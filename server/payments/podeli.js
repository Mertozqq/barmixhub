import crypto from 'node:crypto';

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function toAmount(rubles) {
  return Math.round(Number(rubles) * 100) / 100;
}

function formatDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function splitClientName(fullName) {
  const parts = String(fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: parts[0] || 'Клиент',
    lastName: parts.slice(1).join(' ') || 'BarMixHub',
  };
}

export function isPodeliConfigured(env) {
  return env.enabled && hasValue(env.login) && hasValue(env.password);
}

export function assertPodeliConfigured(env) {
  if (isPodeliConfigured(env)) {
    return;
  }

  throw new Error('Подели еще не настроен: заполните PODELI_LOGIN и PODELI_PASSWORD.');
}

export function getPodeliProviderMeta(env) {
  return {
    code: 'podeli',
    name: 'Подели',
    methods: ['Оплата частями', 'Альфа-Банк'],
    description: 'Оплата частями через сервис Подели от Альфа-Банка: 25% сразу, остальное позже.',
    available: isPodeliConfigured(env),
  };
}

function buildAuthHeader(env) {
  const credentials = Buffer.from(`${env.login}:${env.password}`, 'utf8').toString('base64');
  return `Basic ${credentials}`;
}

function buildErrorMessage(responsePayload, fallback) {
  const reason =
    responsePayload?.message ||
    responsePayload?.error ||
    responsePayload?.errors?.[0]?.message ||
    responsePayload?.detail;

  return hasValue(String(reason ?? '')) ? String(reason).trim() : fallback;
}

async function callPodeliApi(env, path, init = {}, correlationId = crypto.randomUUID()) {
  let response;

  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      ...init,
      headers: {
        Authorization: buildAuthHeader(env),
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    const details =
      error instanceof Error
        ? [error.message, error.cause instanceof Error ? error.cause.message : '']
            .filter(Boolean)
            .join(' | ')
        : 'Неизвестная ошибка сети';

    throw new Error(`Не удалось выполнить запрос к Подели: ${details}`);
  }

  let responsePayload = null;

  try {
    responsePayload = await response.json();
  } catch {
    responsePayload = null;
  }

  if (!response.ok) {
    throw new Error(
      buildErrorMessage(responsePayload, `Подели вернул ошибку (HTTP ${response.status}).`),
    );
  }

  return responsePayload;
}

export function buildPodeliOrderPayload(order, env) {
  const { firstName, lastName } = splitClientName(order.name);
  const amount = toAmount(order.amountRub);

  const notificationUrl = new URL(env.notificationUrl);

  if (hasValue(env.webhookToken)) {
    notificationUrl.searchParams.set('token', env.webhookToken);
  }

  return {
    order: {
      id: order.orderId,
      amount,
      prepaidAmount: 0,
      items: [
        {
          id: order.courseId,
          name: order.title,
          amount,
          quantity: 1,
          prepaidAmount: 0,
        },
      ],
      isTwoStagePayment: env.twoStagePayment,
    },
    clientInfo: {
      firstName,
      lastName,
      phone: formatDigits(order.phone),
      email: String(order.email).trim(),
    },
    notificationUrl: notificationUrl.toString(),
    successUrl: env.successUrl,
    failUrl: env.failUrl,
  };
}

export async function createPodeliOrder(order, env) {
  const requestPayload = buildPodeliOrderPayload(order, env);

  const responsePayload = await callPodeliApi(env, '/orders/create', {
    method: 'POST',
    body: JSON.stringify(requestPayload),
  });

  const paymentUrl = String(responsePayload?.redirectUrl ?? '').trim();

  if (!paymentUrl) {
    throw new Error('Подели не вернул ссылку на оплату.');
  }

  return {
    paymentUrl,
    raw: responsePayload,
    requestPayload,
  };
}

export async function getPodeliOrderInfo(orderId, env) {
  return callPodeliApi(env, `/orders/${encodeURIComponent(orderId)}/info`, {
    method: 'GET',
  });
}

export async function commitPodeliOrder(orderId, env) {
  return callPodeliApi(env, `/orders/${encodeURIComponent(orderId)}/commit`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function mapPodeliStatus(status) {
  const normalized = String(status ?? '').trim().toUpperCase();

  if (normalized === 'COMPLETED' || normalized === 'COMMITTED') {
    return 'succeeded';
  }

  if (normalized === 'APPROVED' || normalized === 'WAIT_FOR_COMMIT') {
    return 'authorized';
  }

  if (
    normalized === 'CANCELLED' ||
    normalized === 'REJECTED' ||
    normalized === 'REFUNDED' ||
    normalized === 'EXPIRED'
  ) {
    return 'failed';
  }

  return 'pending';
}

export function extractPodeliOrderStatus(orderInfo) {
  return String(orderInfo?.status ?? orderInfo?.order?.status ?? '').trim();
}

export function normalizePodeliWebhook(payload) {
  const orderId = String(
    payload?.orderId ?? payload?.order?.id ?? payload?.id ?? '',
  ).trim();
  const status = String(payload?.status ?? payload?.order?.status ?? '').trim();

  return {
    orderId,
    status,
    raw: payload ?? null,
  };
}

export function validatePodeliWebhookToken(queryToken, env) {
  if (!hasValue(env.webhookToken)) {
    return true;
  }

  const provided = Buffer.from(String(queryToken ?? ''), 'utf8');
  const expected = Buffer.from(env.webhookToken, 'utf8');

  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}
