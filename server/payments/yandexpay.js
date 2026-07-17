import crypto from 'node:crypto';

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function appendOrderId(url, orderId) {
  const target = new URL(url);
  target.searchParams.set('order_id', orderId);
  return target.toString();
}

function toDecimalString(rubles) {
  return Number(rubles).toFixed(2);
}

export function isYandexPayConfigured(env) {
  return hasValue(env.apiKey);
}

export function assertYandexPayConfigured(env) {
  if (isYandexPayConfigured(env)) {
    return;
  }

  throw new Error('Яндекс Пэй еще не настроен: заполните YANDEX_PAY_API_KEY.');
}

export function getYandexPayProviderMeta(env) {
  return {
    code: 'yandex-split',
    name: 'Яндекс Сплит',
    methods: ['Оплата частями'],
    description: 'Оплата частями через Яндекс Сплит без переплат.',
    available: isYandexPayConfigured(env),
  };
}

function buildErrorMessage(responsePayload, fallback) {
  const reason = responsePayload?.data?.message || responsePayload?.reason || responsePayload?.message;
  const reasonCode = responsePayload?.reasonCode || responsePayload?.data?.reasonCode;
  const parts = [reasonCode ? `Код: ${reasonCode}` : '', reason ?? '']
    .map((value) => String(value).trim())
    .filter(Boolean);

  return parts.length ? parts.join(' | ') : fallback;
}

export function buildYandexPayOrderPayload(order, env) {
  return {
    orderId: order.orderId,
    currencyCode: 'RUB',
    availablePaymentMethods: env.paymentMethods,
    cart: {
      items: [
        {
          productId: order.courseId,
          title: order.title,
          quantity: { count: '1' },
          unitPrice: toDecimalString(order.amountRub),
          total: toDecimalString(order.amountRub),
        },
      ],
      total: {
        amount: toDecimalString(order.amountRub),
      },
    },
    redirectUrls: {
      onSuccess: appendOrderId(env.successUrl, order.orderId),
      onError: appendOrderId(env.failUrl, order.orderId),
    },
    ttl: env.ttlSeconds,
    metadata: JSON.stringify({
      courseId: order.courseId,
      promo: order.promo || undefined,
    }),
  };
}

async function callYandexPayApi(env, path, init = {}) {
  let response;

  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Api-Key ${env.apiKey}`,
        'Content-Type': 'application/json',
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

    throw new Error(`Не удалось выполнить запрос к Яндекс Пэй: ${details}`);
  }

  let responsePayload;

  try {
    responsePayload = await response.json();
  } catch {
    throw new Error('Яндекс Пэй вернул некорректный ответ.');
  }

  if (!response.ok || responsePayload?.status !== 'success') {
    throw new Error(buildErrorMessage(responsePayload, 'Яндекс Пэй вернул ошибку.'));
  }

  return responsePayload;
}

export async function createYandexPayOrder(order, env) {
  const requestPayload = buildYandexPayOrderPayload(order, env);

  const responsePayload = await callYandexPayApi(env, '/api/merchant/v1/orders', {
    method: 'POST',
    body: JSON.stringify(requestPayload),
  });

  const paymentUrl = String(responsePayload?.data?.paymentUrl ?? '').trim();

  if (!paymentUrl) {
    throw new Error('Яндекс Пэй не вернул ссылку на оплату.');
  }

  return {
    paymentUrl,
    raw: responsePayload,
    requestPayload,
  };
}

export async function getYandexPayOrderState(orderId, env) {
  const responsePayload = await callYandexPayApi(
    env,
    `/api/merchant/v1/orders/${encodeURIComponent(orderId)}`,
    { method: 'GET' },
  );

  return responsePayload?.data?.order ?? null;
}

export function mapYandexPayStatus(paymentStatus) {
  const normalized = String(paymentStatus ?? '').trim().toUpperCase();

  if (normalized === 'CAPTURED' || normalized === 'CONFIRMED' || normalized === 'SUCCESS') {
    return 'succeeded';
  }

  if (normalized === 'AUTHORIZED') {
    return 'authorized';
  }

  if (
    normalized === 'FAILED' ||
    normalized === 'FAIL' ||
    normalized === 'VOIDED' ||
    normalized === 'REFUNDED' ||
    normalized === 'PARTIALLY_REFUNDED'
  ) {
    return 'failed';
  }

  return 'pending';
}

const jwksCache = {
  url: '',
  keys: null,
  fetchedAt: 0,
};

const JWKS_TTL_MS = 60 * 60 * 1000;

async function fetchYandexPayJwks(env) {
  const jwksUrl = `${env.apiUrl}/api/jwks`;
  const now = Date.now();

  if (jwksCache.keys && jwksCache.url === jwksUrl && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }

  const response = await fetch(jwksUrl);

  if (!response.ok) {
    throw new Error('Не удалось загрузить ключи подписи Яндекс Пэй (JWKS).');
  }

  const payload = await response.json();

  if (!Array.isArray(payload?.keys) || payload.keys.length === 0) {
    throw new Error('Яндекс Пэй вернул пустой набор ключей подписи.');
  }

  jwksCache.url = jwksUrl;
  jwksCache.keys = payload.keys;
  jwksCache.fetchedAt = now;

  return payload.keys;
}

function decodeBase64Url(value) {
  return Buffer.from(String(value), 'base64url');
}

export async function verifyYandexPayWebhook(rawBody, env) {
  const token = Buffer.isBuffer(rawBody)
    ? rawBody.toString('utf8').trim()
    : String(rawBody ?? '').trim();

  const segments = token.split('.');

  if (segments.length !== 3) {
    throw new Error('Webhook Яндекс Пэй имеет некорректный формат (ожидается JWT).');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = segments;

  let header;
  let payload;

  try {
    header = JSON.parse(decodeBase64Url(encodedHeader).toString('utf8'));
    payload = JSON.parse(decodeBase64Url(encodedPayload).toString('utf8'));
  } catch {
    throw new Error('Не удалось разобрать JWT из webhook Яндекс Пэй.');
  }

  if (header?.alg !== 'ES256') {
    throw new Error(`Webhook Яндекс Пэй подписан неподдерживаемым алгоритмом: ${header?.alg}.`);
  }

  const keys = await fetchYandexPayJwks(env);
  const candidates = header?.kid ? keys.filter((key) => key.kid === header.kid) : keys;

  if (candidates.length === 0) {
    throw new Error('Не найден ключ подписи для webhook Яндекс Пэй.');
  }

  const signedContent = Buffer.from(`${encodedHeader}.${encodedPayload}`, 'utf8');
  const signature = decodeBase64Url(encodedSignature);

  const isValid = candidates.some((jwk) => {
    try {
      const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });

      return crypto.verify(
        'sha256',
        signedContent,
        { key: publicKey, dsaEncoding: 'ieee-p1363' },
        signature,
      );
    } catch {
      return false;
    }
  });

  if (!isValid) {
    throw new Error('Подпись webhook Яндекс Пэй не прошла проверку.');
  }

  if (hasValue(env.merchantId) && hasValue(payload?.merchantId) && payload.merchantId !== env.merchantId) {
    throw new Error('Webhook Яндекс Пэй пришел для другого мерчанта.');
  }

  return payload;
}

export function normalizeYandexPayWebhook(payload) {
  const order = payload?.order ?? {};

  return {
    event: String(payload?.event ?? '').trim(),
    eventTime: String(payload?.eventTime ?? '').trim(),
    merchantId: String(payload?.merchantId ?? '').trim(),
    orderId: String(order?.orderId ?? '').trim(),
    paymentStatus: String(order?.paymentStatus ?? '').trim(),
    raw: payload,
  };
}
