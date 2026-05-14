# Telegram Relay Worker

Небольшой `Cloudflare Worker`, который принимает событие от backend BarMix и отправляет уведомление в Telegram.

## Что делает

- принимает `POST /`
- проверяет `Authorization: Bearer <RELAY_SHARED_TOKEN>`
- ожидает событие `payment.succeeded`
- отправляет сообщение в Telegram через `sendMessage`

## Секреты Worker

Нужно добавить в Cloudflare:

- `RELAY_SHARED_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_MESSAGE_THREAD_ID` — опционально, если используешь тему в группе

## Быстрый деплой

1. Создай отдельный Worker в Cloudflare.
2. Возьми [wrangler.toml.example](./wrangler.toml.example) за основу.
3. Добавь secrets:

```bash
wrangler secret put RELAY_SHARED_TOKEN
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
```

4. Задеплой Worker:

```bash
wrangler deploy
```

## Что указать на backend

В `.env` основного сайта:

```env
TELEGRAM_RELAY_ENABLED=true
TELEGRAM_RELAY_URL=https://<your-worker>.workers.dev/
TELEGRAM_RELAY_TOKEN=<same RELAY_SHARED_TOKEN>
```

## Формат входящего события

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
