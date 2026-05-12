import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import {
  assertTbankConfigured,
  buildTbankToken,
  createTbankPayment,
  getTbankProviderMeta,
  mapStatus as mapTbankStatus,
  normalizeWebhook as normalizeTbankWebhook,
  validateWebhookToken as validateTbankWebhookToken,
} from './payments/tbank.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.join(__dirname, 'storage');
const ordersFilePath = path.join(storageDir, 'orders.ndjson');

const app = express();
const port = Number(process.env.PORT || 4242);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;

const tbankEnv = {
  apiUrl: process.env.TBANK_API_URL || 'https://securepay.tinkoff.ru/v2',
  apiToken: process.env.TBANK_API_TOKEN || '',
  terminalKey: process.env.TBANK_TERMINAL_KEY || '',
  secretKey: process.env.TBANK_SECRET_KEY || process.env.TBANK_TERMINAL_PASSWORD || '',
  notificationUrl: process.env.TBANK_NOTIFICATION_URL || `${publicBaseUrl}/api/payments/webhook`,
  successUrl: process.env.TBANK_SUCCESS_URL || `${clientUrl}/payment/success`,
  failUrl: process.env.TBANK_FAIL_URL || `${clientUrl}/payment/fail`,
  supportEmail: process.env.SUPPORT_EMAIL || 'barmixhub@mail.ru',
  sendReceipt: String(process.env.TBANK_SEND_RECEIPT || 'false').trim().toLowerCase() === 'true',
  taxation: process.env.TBANK_TAXATION || 'usn_income',
  vat: process.env.TBANK_VAT || 'none',
  paymentMethod: process.env.TBANK_PAYMENT_METHOD || 'full_prepayment',
  paymentObject: process.env.TBANK_PAYMENT_OBJECT || 'service',
};

const courseCatalog = {
  'bar-foundation': {
    id: 'bar-foundation',
    title: 'Барный интенсив',
    priceRub: 39500,
    description:
      'Шестинедельный очный интенсив с погружением в барную среду, сервис и рабочую логику смены.',
  },
};

const paymentProviders = [getTbankProviderMeta(tbankEnv)];
const defaultProvider = paymentProviders.find((provider) => provider.available)?.code || 'tbank';

const ordersByOrderId = new Map();
const ordersByPaymentId = new Map();

app.use(cors());
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

function formatDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function generateOrderId(courseId) {
  const shortCourseId = String(courseId).replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase() || 'ORDER';
  const shortRandom = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  return `BM-${shortCourseId}-${shortRandom}`;
}

function toKopecks(rubles) {
  return Math.round(Number(rubles) * 100);
}

function fromKopecks(kopecks) {
  return typeof kopecks === 'number' ? kopecks / 100 : undefined;
}

function getValidationError({ name, phone, email }) {
  if (String(name).trim().length < 2) {
    return 'Введите имя не короче 2 символов.';
  }

  if (formatDigits(phone).length < 10) {
    return 'Введите корректный номер телефона.';
  }

  if (!String(email).includes('@')) {
    return 'Введите корректный email.';
  }

  return '';
}

function indexOrder(order) {
  ordersByOrderId.set(order.orderId, order);

  if (order.paymentId) {
    ordersByPaymentId.set(order.paymentId, order);
  }
}

async function appendOrderRecord(order) {
  await fs.mkdir(storageDir, { recursive: true });
  await fs.appendFile(ordersFilePath, `${JSON.stringify(order)}\n`, 'utf8');
}

async function persistOrder(order) {
  indexOrder(order);
  await appendOrderRecord(order);
}

async function hydrateOrders() {
  try {
    const raw = await fs.readFile(ordersFilePath, 'utf8');

    for (const line of raw.split(/\r?\n/).filter(Boolean)) {
      try {
        const order = JSON.parse(line);

        if (order?.orderId) {
          indexOrder(order);
        }
      } catch (error) {
        console.error('Skipping broken order record:', error);
      }
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return;
    }

    console.error('Failed to hydrate orders from storage:', error);
  }
}

function findOrder({ paymentId, orderId }) {
  if (paymentId && ordersByPaymentId.has(paymentId)) {
    return ordersByPaymentId.get(paymentId);
  }

  if (orderId && ordersByOrderId.has(orderId)) {
    return ordersByOrderId.get(orderId);
  }

  return null;
}

async function callTbankState(paymentId) {
  const payload = {
    TerminalKey: tbankEnv.terminalKey,
    PaymentId: paymentId,
  };

  const response = await fetch(`${tbankEnv.apiUrl}/GetState`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tbankEnv.apiToken}`,
    },
    body: JSON.stringify({
      ...payload,
      Token: buildTbankToken(payload, tbankEnv.secretKey),
    }),
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error('Банк вернул некорректный ответ на запрос статуса.');
  }

  if (!response.ok || result?.Success === false) {
    throw new Error(result?.Details || result?.Message || 'Не удалось получить статус платежа.');
  }

  return result;
}

async function sendPaymentStatus(response, { paymentId = '', orderId = '' }) {
  const normalizedPaymentId = String(paymentId).trim();
  const normalizedOrderId = String(orderId).trim();

  if (!normalizedPaymentId && !normalizedOrderId) {
    response.status(400).json({ error: 'Не передан идентификатор платежа.' });
    return;
  }

  const knownOrder = findOrder({
    paymentId: normalizedPaymentId,
    orderId: normalizedOrderId,
  });

  if (!normalizedPaymentId) {
    response.json({
      success: true,
      paymentId: knownOrder?.paymentId || '',
      orderId: knownOrder?.orderId || normalizedOrderId,
      status: knownOrder?.status || 'pending',
      amount: knownOrder?.amountRub,
      paymentUrl: knownOrder?.paymentUrl || null,
    });
    return;
  }

  assertTbankConfigured(tbankEnv);
  const bankState = await callTbankState(normalizedPaymentId);
  const mappedStatus = mapTbankStatus(bankState.Status, bankState.Success === true);

  if (knownOrder) {
    const updatedOrder = {
      ...knownOrder,
      paymentId: normalizedPaymentId,
      status: mappedStatus,
      paymentDetails: {
        ...(knownOrder.paymentDetails ?? {}),
        lastStateResponse: bankState,
      },
      updatedAt: new Date().toISOString(),
    };

    await persistOrder(updatedOrder);
  }

  response.json({
    success: true,
    paymentId: normalizedPaymentId,
    orderId: bankState.OrderId || knownOrder?.orderId || normalizedOrderId,
    status: bankState.Status || mappedStatus,
    amount: fromKopecks(typeof bankState.Amount === 'number' ? bankState.Amount : undefined),
    paymentUrl: bankState.PaymentURL || knownOrder?.paymentUrl || null,
  });
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/payments/config', (_request, response) => {
  response.json({
    payment_enabled: paymentProviders.some((provider) => provider.available),
    support_email: process.env.SUPPORT_EMAIL || 'barmixhub@mail.ru',
    support_phone: process.env.SUPPORT_PHONE || '+7 (999) 000-00-00',
    merchant_name: process.env.MERCHANT_NAME || 'BarMix',
    default_provider: defaultProvider,
  });
});

app.get('/api/payments/providers', (_request, response) => {
  response.json({
    default_provider: defaultProvider,
    providers: paymentProviders.map(({ code, name, methods, description }) => ({
      code,
      name,
      methods,
      description,
    })),
  });
});

app.get('/api/payments/status', async (request, response) => {
  try {
    await sendPaymentStatus(response, {
      paymentId: String(request.query.payment_id ?? request.query.paymentId ?? '').trim(),
      orderId: String(request.query.order_id ?? request.query.orderId ?? '').trim(),
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Не удалось получить статус платежа.',
    });
  }
});

app.post('/api/leads', (request, response) => {
  const { name = '', phone = '', email = '', message = '' } = request.body ?? {};
  const error = getValidationError({ name, phone, email });

  if (error) {
    response.status(400).json({ error });
    return;
  }

  console.log('[lead]', {
    name,
    phone,
    email,
    message,
    createdAt: new Date().toISOString(),
  });

  response.json({
    message: 'Спасибо, заявка принята. Мы свяжемся с вами в ближайшее время.',
  });
});

app.post('/api/payments/create', async (request, response) => {
  try {
    assertTbankConfigured(tbankEnv);

    const {
      courseId,
      name = '',
      phone = '',
      email = '',
      promo = '',
      paymentProvider = defaultProvider,
    } = request.body ?? {};

    if (paymentProvider !== 'tbank') {
      response.status(400).json({ error: 'Сейчас подключен только T-Банк.' });
      return;
    }

    const course = courseCatalog[courseId];

    if (!course) {
      response.status(400).json({ error: 'Выбранный интенсив не найден.' });
      return;
    }

    const validationError = getValidationError({ name, phone, email });

    if (validationError) {
      response.status(400).json({ error: validationError });
      return;
    }

    const order = {
      orderId: generateOrderId(course.id),
      courseId: course.id,
      title: course.title,
      description: `${course.title}. ${course.description}`,
      amountKopecks: toKopecks(course.priceRub),
      amountRub: course.priceRub,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim(),
      promo: String(promo).trim().toUpperCase(),
      paymentProvider: 'tbank',
      paymentId: '',
      paymentUrl: '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      paymentDetails: null,
    };

    const payment = await createTbankPayment(order, tbankEnv);

    const persistedOrder = {
      ...order,
      paymentId: payment.paymentId,
      paymentUrl: payment.paymentUrl,
      status: mapTbankStatus(payment.status, false),
      paymentDetails: {
        gateway: 'tbank',
        initRequest: payment.requestPayload,
        initResponse: payment.raw,
        tokenDebug: payment.tokenDebug,
      },
    };

    await persistOrder(persistedOrder);

    response.json({
      success: true,
      paymentId: persistedOrder.paymentId,
      orderId: persistedOrder.orderId,
      paymentUrl: persistedOrder.paymentUrl,
    });
  } catch (error) {
    console.error('Payment creation failed:', error);
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Не удалось создать платеж.',
    });
  }
});

app.get('/api/payments/status/:paymentId', async (request, response) => {
  try {
    await sendPaymentStatus(response, {
      paymentId: String(request.params.paymentId ?? '').trim(),
      orderId: String(request.query.order_id ?? request.query.orderId ?? '').trim(),
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Не удалось получить статус платежа.',
    });
  }
});

app.post('/api/payments/webhook', async (request, response) => {
  try {
    assertTbankConfigured(tbankEnv);

    if (!validateTbankWebhookToken(request.body, tbankEnv.secretKey)) {
      response.status(400).type('text/plain').send('INVALID TOKEN');
      return;
    }

    const webhook = normalizeTbankWebhook(request.body);

    if (!webhook.orderId) {
      response.status(400).json({ error: 'В webhook T-Банка не передан OrderId.' });
      return;
    }

    const existingOrder = findOrder({
      paymentId: webhook.paymentId,
      orderId: webhook.orderId,
    });

    if (!existingOrder) {
      response.status(404).json({ error: 'Заказ для webhook T-Банка не найден.' });
      return;
    }

    const updatedOrder = {
      ...existingOrder,
      paymentId: webhook.paymentId || existingOrder.paymentId,
      status: mapTbankStatus(webhook.status, webhook.success),
      webhookReceivedAt: new Date().toISOString(),
      paymentDetails: {
        ...(existingOrder.paymentDetails ?? {}),
        lastWebhook: webhook.raw,
      },
    };

    await persistOrder(updatedOrder);

    console.log('[payment-webhook:tbank]', {
      orderId: updatedOrder.orderId,
      paymentId: updatedOrder.paymentId,
      status: updatedOrder.status,
    });

    response.type('text/plain').send('OK');
  } catch (error) {
    console.error('T-Bank webhook processing failed:', error);
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Не удалось обработать webhook T-Банка.',
    });
  }
});

hydrateOrders().then(() => {
  console.log(`Hydrated ${ordersByOrderId.size} orders from storage.`);

  app.listen(port, () => {
    console.log(`BarMix backend is listening on http://localhost:${port}`);
  });
});
