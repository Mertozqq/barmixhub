# Telegram Relay Worker

Небольшой `Cloudflare Worker`, который принимает событие от backend BarMixHub и рассылает уведомление только заранее разрешенным Telegram-пользователям.

## Как устроен доступ

- список допущенных пользователей задается вручную через `ALLOWED_TELEGRAM_IDS`
- `/start` никого не добавляет
- если пользователь не в allowlist, бот отвечает, что доступ не выдан
- если пользователь в allowlist, бот подтверждает доступ и может получать уведомления

Важно:
- даже разрешенный пользователь должен хотя бы один раз открыть бот и нажать `Start`, иначе Telegram не даст боту писать ему первым

## Маршруты Worker

- `GET /health`
- `POST /notify` — вызывается backend сайта после успешной оплаты
- `POST /telegram/webhook` — webhook от Telegram

## Что нужно задать в Cloudflare

Секреты:

- `RELAY_SHARED_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`

Обычные переменные:

- `ALLOWED_TELEGRAM_IDS`

Пример:

```text
ALLOWED_TELEGRAM_IDS=123456789,987654321
```

## Быстрый деплой

1. Создай отдельный Worker в Cloudflare.
2. Возьми [wrangler.toml.example](./wrangler.toml.example) за основу.
3. Добавь secrets:

```bash
wrangler secret put RELAY_SHARED_TOKEN
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_WEBHOOK_SECRET
```

4. Добавь переменную:

```bash
wrangler secret put ALLOWED_TELEGRAM_IDS
```

Если хочешь хранить allowlist не как secret, можно задать его обычной переменной в Dashboard.

5. Задеплой Worker:

```bash
wrangler deploy
```

## Что указать на backend

В `.env` основного сайта:

```env
TELEGRAM_RELAY_ENABLED=true
TELEGRAM_RELAY_URL=https://<your-worker>.workers.dev/notify
TELEGRAM_RELAY_TOKEN=<same RELAY_SHARED_TOKEN>
```

## Подключение Telegram webhook

После деплоя нужно один раз вызвать:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<your-worker>.workers.dev/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

## Полезные команды в боте

- `/start` — подтверждение доступа для разрешенного пользователя
- `/id` — показать свой Telegram ID

## Формат события от backend

```json
{
  "event": "payment.succeeded",
  "order": {
    "orderId": "BM-...",
    "paymentId": "123456",
    "status": "succeeded",
    "title": "Барный интенсив",
    "amountRub": 39500,
    "amountKopecks": 3950000,
    "customer": {
      "name": "Иван",
      "phone": "+7...",
      "email": "mail@example.com"
    },
    "promo": "",
    "paymentProvider": "tbank",
    "createdAt": "2026-05-13T10:00:00.000Z"
  }
}
```
