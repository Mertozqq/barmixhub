import crypto from 'node:crypto';

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function withOptionalData(data) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => hasValue(value)));
}

function appendOrderId(url, orderId) {
  const target = new URL(url);
  target.searchParams.set('order_id', orderId);
  return target.toString();
}

function buildErrorMessage(responsePayload, fallback) {
  const parts = [
    responsePayload?.ErrorCode ? `ErrorCode: ${responsePayload.ErrorCode}` : '',
    responsePayload?.Message ?? '',
    responsePayload?.Details ?? '',
  ]
    .map((value) => String(value).trim())
    .filter(Boolean);

  return parts.length ? parts.join(' | ') : fallback;
}

export function isTbankConfigured(env) {
  return hasValue(env.terminalKey) && hasValue(env.secretKey);
}

export function assertTbankConfigured(env) {
  if (isTbankConfigured(env)) {
    return;
  }

  throw new Error('T-Р‘Р°РЅРє РµС‰Рµ РЅРµ РЅР°СЃС‚СЂРѕРµРЅ: Р·Р°РїРѕР»РЅРёС‚Рµ TBANK_TERMINAL_KEY Рё TBANK_SECRET_KEY.');
}

export function getTbankProviderMeta(env) {
  return {
    code: 'tbank',
    name: 'T-Р‘Р°РЅРє',
    methods: ['РљР°СЂС‚С‹', 'РЎР‘Рџ', 'T-Pay', 'Р Р°СЃСЃСЂРѕС‡РєР°'],
    description: 'РћСЃРЅРѕРІРЅРѕР№ РїСЂРѕРІР°Р№РґРµСЂ РґР»СЏ РѕРЅР»Р°Р№РЅ-РѕРїР»Р°С‚С‹ Рё РѕС„РѕСЂРјР»РµРЅРёСЏ СЂР°СЃСЃСЂРѕС‡РєРё.',
    available: isTbankConfigured(env),
  };
}

export function buildTbankToken(payload, secretKey) {
  const tokenSource = { Password: secretKey };

  for (const [key, value] of Object.entries(payload)) {
    if (key === 'Token' || value == null || typeof value === 'object') {
      continue;
    }

    tokenSource[key] = String(value);
  }

  const rawToken = Object.keys(tokenSource)
    .sort()
    .map((key) => tokenSource[key])
    .join('');

  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function buildTbankTokenDebug(payload, secretKey) {
  const tokenSource = { Password: secretKey };

  for (const [key, value] of Object.entries(payload)) {
    if (key === 'Token' || value == null || typeof value === 'object') {
      continue;
    }

    tokenSource[key] = String(value);
  }

  const sortedEntries = Object.entries(tokenSource).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const rawToken = sortedEntries.map(([, value]) => value).join('');

  return {
    keys: sortedEntries.map(([key]) => key),
    values_length: Object.fromEntries(
      sortedEntries.map(([key, value]) => [key, String(value).length]),
    ),
    terminal_key_length: String(payload.TerminalKey ?? '').length,
    secret_key_length: String(secretKey ?? '').length,
    secret_key_fingerprint: crypto
      .createHash('sha256')
      .update(String(secretKey ?? ''))
      .digest('hex')
      .slice(0, 12),
    raw_token_length: rawToken.length,
    token: crypto.createHash('sha256').update(rawToken).digest('hex'),
  };
}

export function buildInitPayload(order, env) {
  const payload = {
    TerminalKey: env.terminalKey,
    Amount: order.amountKopecks,
    OrderId: order.orderId,
    Description: order.description,
    PayType: 'O',
    NotificationURL: env.notificationUrl,
    SuccessURL: appendOrderId(env.successUrl, order.orderId),
    FailURL: appendOrderId(env.failUrl, order.orderId),
    DATA: withOptionalData({
      OperationInitiatorType: '0',
      CourseId: order.courseId,
      Promo: order.promo,
    }),
  };

  if (env.sendReceipt) {
    payload.Receipt = {
      Email: order.email || env.supportEmail,
      Taxation: env.taxation,
      Items: [
        {
          Name: order.title,
          Price: order.amountKopecks,
          Quantity: 1,
          Amount: order.amountKopecks,
          Tax: env.vat,
          PaymentMethod: env.paymentMethod,
          PaymentObject: env.paymentObject,
        },
      ],
    };
  }

  return payload;
}

export async function createTbankPayment(order, env) {
  const payload = buildInitPayload(order, env);
  const token = buildTbankToken(payload, env.secretKey);
  const tokenDebug = buildTbankTokenDebug(payload, env.secretKey);
  const requestPayload = {
    ...payload,
    Token: token,
  };

  let response;

  try {
    response = await fetch(`${env.apiUrl}/Init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });
  } catch (error) {
    const details =
      error instanceof Error
        ? [error.message, error.cause instanceof Error ? error.cause.message : ''].filter(Boolean).join(' | ')
        : 'РќРµРёР·РІРµСЃС‚РЅР°СЏ РѕС€РёР±РєР° СЃРµС‚Рё';

    throw new Error(`РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ Init-Р·Р°РїСЂРѕСЃ РІ T-Р‘Р°РЅРє: ${details}`);
  }

  let responsePayload;

  try {
    responsePayload = await response.json();
  } catch {
    throw new Error('T-Р‘Р°РЅРє РІРµСЂРЅСѓР» РЅРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ РѕС‚РІРµС‚ РЅР° Init-Р·Р°РїСЂРѕСЃ.');
  }

  if (!response.ok) {
    throw new Error(buildErrorMessage(responsePayload, 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РїР»Р°С‚РµР¶ РІ T-Р‘Р°РЅРєРµ.'));
  }

  if (!responsePayload?.Success || !hasValue(responsePayload?.PaymentURL)) {
    throw new Error(buildErrorMessage(responsePayload, 'T-Р‘Р°РЅРє РЅРµ РІРµСЂРЅСѓР» СЃСЃС‹Р»РєСѓ РЅР° РѕРїР»Р°С‚Сѓ.'));
  }

  return {
    paymentId: String(responsePayload.PaymentId ?? '').trim(),
    paymentUrl: String(responsePayload.PaymentURL ?? '').trim(),
    status: String(responsePayload.Status ?? '').trim(),
    raw: responsePayload,
    requestPayload,
    tokenDebug,
  };
}

export function normalizeWebhook(body) {
  return {
    paymentId: String(body?.PaymentId ?? body?.payment_id ?? '').trim(),
    orderId: String(body?.OrderId ?? body?.order_id ?? '').trim(),
    status: String(body?.Status ?? body?.status ?? '').trim().toLowerCase(),
    success: Boolean(body?.Success ?? body?.success ?? false),
    token: String(body?.Token ?? body?.token ?? '').trim().toLowerCase(),
    amount: typeof body?.Amount === 'number' ? body.Amount : Number(body?.Amount ?? 0) || null,
    raw: body,
  };
}

export function validateWebhookToken(body, secretKey) {
  const providedToken = String(body?.Token ?? body?.token ?? '').trim().toLowerCase();

  if (!providedToken) {
    return false;
  }

  return buildTbankToken(body, secretKey) === providedToken;
}

export function mapStatus(status, success) {
  const normalized = String(status ?? '').trim().toLowerCase();

  if (success && normalized === 'confirmed') {
    return 'succeeded';
  }

  if (normalized === 'authorized') {
    return 'authorized';
  }

  if (
    normalized === 'auth_fail' ||
    normalized === 'rejected' ||
    normalized === 'canceled' ||
    normalized === 'deadline_expired' ||
    normalized === 'reversed' ||
    normalized === 'refunded' ||
    normalized === 'partial_refunded' ||
    normalized === 'partial_reversed'
  ) {
    return 'failed';
  }

  return 'pending';
}
