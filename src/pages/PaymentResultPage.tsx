import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/Reveal';
import { api } from '../lib/api';
import { formatPrice } from '../lib/format';
import type { PaymentStatusResponse } from '../types';

type PaymentResultPageProps = {
  mode: 'success' | 'fail' | 'pending';
};

export function PaymentResultPage({ mode }: PaymentResultPageProps) {
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState('');
  const paymentId =
    new URLSearchParams(window.location.search).get('paymentId') ??
    sessionStorage.getItem('barmix:lastPaymentId');
  const courseTitle = sessionStorage.getItem('barmix:lastCourseTitle');

  useEffect(() => {
    if (!paymentId) return;

    let active = true;

    api.getPaymentStatus(paymentId)
      .then((response) => {
        if (active) setStatus(response);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Не удалось проверить статус платежа.',
          );
        }
      });

    return () => {
      active = false;
    };
  }, [paymentId]);

  const isSuccess = mode === 'success' || status?.status === 'CONFIRMED';
  const title =
    mode === 'fail'
      ? 'Оплата не завершена'
      : mode === 'pending'
        ? 'Платеж обрабатывается'
        : isSuccess
          ? 'Оплата прошла успешно'
          : 'Статус платежа уточняется';

  const text =
    mode === 'fail'
      ? 'Попробуйте вернуться к оплате или свяжитесь с нами, если нужна помощь.'
      : mode === 'pending'
        ? 'Банк еще подтверждает операцию. Обычно это занимает немного времени.'
        : 'Спасибо за запись. В ближайшее время вы получите подтверждение участия и дальнейшие детали.';

  return (
    <>
      <PageHero eyebrow="статус оплаты" title={title} text={text} />
      <section className="section">
        <div className="container result-card-wrap">
          <Reveal className="result-card">
            <div className={`result-badge ${isSuccess ? 'result-badge--success' : 'result-badge--pending'}`}>
              {isSuccess ? 'успешно' : 'статус'}
            </div>
            <h2>{courseTitle ?? 'Выбранный интенсив'}</h2>
            <p>{text}</p>

            <div className="result-card__meta">
              <span>Номер платежа: {paymentId ?? 'не найден'}</span>
              <span>Статус: {status?.status ?? 'ожидаем ответ банка'}</span>
              <span>
                Сумма: {status?.amount ? formatPrice(status.amount) : 'будет доступна после ответа банка'}
              </span>
            </div>

            {error ? <p className="form-state form-state--error">{error}</p> : null}

            <div className="result-card__actions">
              <Link className="button button--primary" to="/oplata">
                Вернуться к оплате
              </Link>
              <Link className="button button--ghost" to="/contact">
                Связаться с нами
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
