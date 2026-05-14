function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function buildErrorMessage(status, bodyText) {
  const normalizedBody = String(bodyText ?? '').trim();
  return normalizedBody ? `Relay responded with ${status}: ${normalizedBody}` : `Relay responded with ${status}.`;
}

export function isTelegramRelayConfigured(env) {
  return Boolean(env.enabled) && hasValue(env.url) && hasValue(env.token);
}

export async function sendTelegramRelayNotification(order, env) {
  if (!isTelegramRelayConfigured(env)) {
    return {
      delivered: false,
      skipped: true,
      reason: 'relay_not_configured',
    };
  }

  const payload = {
    event: 'payment.succeeded',
    order: {
      orderId: order.orderId,
      paymentId: order.paymentId,
      status: order.status,
      title: order.title,
      amountRub: order.amountRub,
      amountKopecks: order.amountKopecks,
      customer: {
        name: order.name,
        phone: order.phone,
        email: order.email,
      },
      promo: order.promo,
      paymentProvider: order.paymentProvider,
      createdAt: order.createdAt,
      webhookReceivedAt: order.webhookReceivedAt ?? null,
    },
  };

  const response = await fetch(env.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.token}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(env.timeoutMs),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(buildErrorMessage(response.status, responseText));
  }

  let parsedResponse = null;

  try {
    parsedResponse = responseText ? JSON.parse(responseText) : null;
  } catch {
    parsedResponse = { raw: responseText };
  }

  return {
    delivered: true,
    skipped: false,
    statusCode: response.status,
    raw: parsedResponse,
  };
}
