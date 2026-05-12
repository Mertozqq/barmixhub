import cors from 'cors';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4242);

const tbankApiUrl = process.env.TBANK_API_URL || 'https://securepay.tinkoff.ru/v2';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;

const courseCatalog = {
  'bar-foundation': {
    id: 'bar-foundation',
    title: 'Барный интенсив',
    priceRub: 39500,
    description: 'Шестинедельный очный интенсив с погружением в барную среду, сервис и рабочую логику смены.',
  },
};

const paymentProviders = [
  {
    code: 'tbank',
    name: 'T-Банк',
    methods: ['Карты', 'СБП', 'T-Pay', 'Рассрочка'],
    description: 'Основной провайдер для онлайн-оплаты и оформления рассрочки.',
  },
];

app.use(cors());
app.use(express.json());

function requirePaymentCredentials() {
  const required = ['TBANK_TERMINAL_KEY', 'TBANK_TERMINAL_PASSWORD'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Платежная интеграция не настроена. Не хватает переменных: ${missing.join(', ')}.`);
  }

  return {
    terminalKey: process.env.TBANK_TERMINAL_KEY,
    password: process.env.TBANK_TERMINAL_PASSWORD,
    apiToken: process.env.TBANK_API_TOKEN || '',
  };
}

function formatDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function buildOrderId(courseId) {
  return `BM-${courseId}-${Date.now()}`;
}

function buildToken(payload, password) {
  const flat = Object.entries({ ...payload, Password: password })
    .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => String(value))
    .join('');

  return crypto.createHash('sha256').update(flat).digest('hex');
}

async function callTBank(method, payload) {
  const credentials = requirePaymentCredentials();
  const body = {
    TerminalKey: credentials.terminalKey,
    ...payload,
  };

  body.Token = buildToken(body, credentials.password);

  const headers = {
    'Content-Type': 'application/json',
  };

  if (credentials.apiToken) {
    headers.Authorization = `Bearer ${credentials.apiToken}`;
  }

  const response = await fetch(`${tbankApiUrl}/${method}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.Details || result?.Message || 'Банк не принял запрос.');
  }

  if (result?.Success === false) {
    throw new Error(result?.Details || result?.Message || 'Банк вернул ошибку при создании платежа.');
  }

  return result;
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/payments/config', (_request, response) => {
  response.json({
    payment_enabled: Boolean(process.env.TBANK_TERMINAL_KEY && process.env.TBANK_TERMINAL_PASSWORD),
    support_email: process.env.SUPPORT_EMAIL || 'barmixhub@mail.ru',
    support_phone: process.env.SUPPORT_PHONE || '+7 (999) 000-00-00',
    merchant_name: process.env.MERCHANT_NAME || 'BarMix',
    default_provider: 'tbank',
  });
});

app.get('/api/payments/providers', (_request, response) => {
  response.json({
    default_provider: 'tbank',
    providers: paymentProviders,
  });
});

app.post('/api/leads', (request, response) => {
  const { name = '', phone = '', email = '', message = '' } = request.body ?? {};

  if (String(name).trim().length < 2) {
    response.status(400).json({ error: 'Имя должно быть не короче 2 символов.' });
    return;
  }

  if (formatDigits(phone).length < 10) {
    response.status(400).json({ error: 'Введите корректный номер телефона.' });
    return;
  }

  if (!String(email).includes('@')) {
    response.status(400).json({ error: 'Введите корректный email.' });
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
    const {
      courseId,
      name = '',
      phone = '',
      email = '',
      promo = '',
      paymentProvider = 'tbank',
    } = request.body ?? {};
    const course = courseCatalog[courseId];

    if (!course) {
      response.status(400).json({ error: 'Выбранный интенсив не найден.' });
      return;
    }

    if (paymentProvider !== 'tbank') {
      response.status(400).json({ error: 'Сейчас подключен только T-Банк.' });
      return;
    }

    if (String(name).trim().length < 2) {
      response.status(400).json({ error: 'Введите имя не короче 2 символов.' });
      return;
    }

    if (formatDigits(phone).length < 10) {
      response.status(400).json({ error: 'Введите корректный номер телефона.' });
      return;
    }

    if (!String(email).includes('@')) {
      response.status(400).json({ error: 'Введите корректный email.' });
      return;
    }

    const orderId = buildOrderId(course.id);
    const amount = course.priceRub * 100;

    const bankResponse = await callTBank('Init', {
      Amount: amount,
      OrderId: orderId,
      Description: `${course.title}. ${course.description}`,
      SuccessURL: `${clientUrl}/payment/success`,
      FailURL: `${clientUrl}/payment/fail`,
      NotificationURL: `${publicBaseUrl}/api/payments/webhook`,
      DATA: {
        Phone: String(phone),
        Email: String(email),
        Name: String(name),
        Promo: String(promo),
        CourseId: String(course.id),
      },
    });

    response.json({
      success: true,
      paymentId: String(bankResponse.PaymentId),
      orderId,
      paymentUrl: bankResponse.PaymentURL,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Не удалось создать платеж.',
    });
  }
});

app.get('/api/payments/status/:paymentId', async (request, response) => {
  try {
    const paymentId = String(request.params.paymentId);
    const bankResponse = await callTBank('GetState', {
      PaymentId: paymentId,
    });

    response.json({
      success: true,
      paymentId,
      orderId: bankResponse.OrderId,
      status: bankResponse.Status,
      amount: typeof bankResponse.Amount === 'number' ? bankResponse.Amount / 100 : undefined,
      paymentUrl: bankResponse.PaymentURL || null,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Не удалось получить статус платежа.',
    });
  }
});

app.post('/api/payments/webhook', (request, response) => {
  console.log('[payment-webhook]', request.body);
  response.type('text/plain').send('OK');
});

app.listen(port, () => {
  console.log(`BarMix backend is listening on http://localhost:${port}`);
});
