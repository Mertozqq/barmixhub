import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
app.use(express.json({ limit: '64kb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, mode: 'local' }));
app.get('/api/payments/config', (_req, res) => res.json({
  payment_enabled: false,
  default_provider: 'tbank',
  merchant_name: 'BarMixHub',
  support_email: 'training@example.com',
}));
app.get('/api/payments/providers', (_req, res) => res.json({
  default_provider: 'tbank',
  providers: [
    { code: 'tbank', name: 'Т-Банк', methods: ['Карты', 'СБП'] },
    { code: 'yandex-split', name: 'Яндекс Сплит', methods: ['Оплата частями'] },
    { code: 'podeli', name: 'Подели', methods: ['Оплата частями'] },
    { code: 'inpocket', name: 'Inpocket', methods: ['Рассрочка'] },
  ].map((provider) => ({ ...provider, available: true, description: 'Выбор для оформления заявки' })),
}));
app.post('/api/payments/create', (_req, res) => res.status(503).json({
  error: 'Оплата недоступна в локальной учебной версии.',
}));
app.post('/api/leads', (req, res) => {
  const { name = '', phone = '', email = '', message = '' } = req.body ?? {};
  const digits = String(phone).replace(/\D/g, '');
  if (String(name).trim().length < 2 || String(name).trim().length > 60 ||
      digits.length < 10 || digits.length > 15 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim()) ||
      String(message).trim().length > 800) {
    return res.status(400).json({ error: 'Проверьте заполнение полей.' });
  }
  res.json({ message: 'Спасибо, заявка принята. Мы свяжемся с вами в ближайшее время.' });
});
app.use('/api', (_req, res) => res.status(404).json({ error: 'Этот API недоступен в локальной версии.' }));
app.use(express.static(dist));
app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
app.listen(4242, '127.0.0.1', () => {
  console.log('Учебный сервер: http://localhost:4242. Оплата отключена, заявки не сохраняются и не отправляются.');
});
