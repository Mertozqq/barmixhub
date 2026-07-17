import { BadgeCheck, CreditCard, Mail, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/Reveal';
import { Seo } from '../components/Seo';
import { SectionEyebrow } from '../components/SectionHeading';
import { courses, paymentDraft } from '../data/content';
import { api } from '../lib/api';
import { formatPrice } from '../lib/format';
import { validateEmail, validateName, validatePhone } from '../lib/validation';
import type { PaymentConfig, PaymentFormState, PaymentProvider } from '../types';

const consentDocuments = [
  { label: 'Согласие на обработку персональных данных', to: '/consent' },
  { label: 'Согласие на распространение данных', to: '/distribution-consent' },
  { label: 'Согласие на рассылку', to: '/mailing-consent' },
];

const fallbackProviders: PaymentProvider[] = [
  {
    code: 'tbank',
    name: 'T-Банк',
    methods: ['Карты', 'СБП', 'T-Pay', 'Рассрочка'],
    description: 'Провайдер по умолчанию',
  },
  {
    code: 'yandex-split',
    name: 'Яндекс Сплит',
    methods: ['Оплата частями'],
    description: 'Оплата частями через Яндекс Сплит',
  },
  {
    code: 'inpocket',
    name: 'Inpocket',
    methods: ['Рассрочка'],
    description: 'Оформление рассрочки в кабинете Inpocket',
  },
];

const installmentProviders = new Set(['yandex-split', 'inpocket']);

export function PaymentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCourseId = searchParams.get('course') ?? courses[0].id;
  const initialCourse = courses.find((course) => course.id === requestedCourseId) ?? courses[0];

  const [selectedCourseId, setSelectedCourseId] = useState(initialCourse.id);
  const [form, setForm] = useState<PaymentFormState>(paymentDraft);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0];
  const allAgreementsAccepted =
    form.privacyAccepted && form.offerAccepted && form.consentsAccepted;

  useEffect(() => {
    setSelectedCourseId(initialCourse.id);
  }, [initialCourse.id]);

  useEffect(() => {
    let active = true;

    Promise.all([api.getPaymentConfig(), api.getPaymentProviders()])
      .then(([paymentConfig, providerResponse]) => {
        if (!active) return;
        setConfig(paymentConfig);
        setProviders(providerResponse.providers);
        setForm((current) => ({
          ...current,
          paymentProvider:
            providerResponse.default_provider || paymentConfig.default_provider || current.paymentProvider,
        }));
      })
      .catch((requestError) => {
        if (!active) return;
        setError(
          requestError instanceof Error ? requestError.message : 'Не удалось загрузить параметры оплаты.',
        );
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validation =
      validateName(form.name) ||
      validatePhone(form.phone) ||
      validateEmail(form.email) ||
      (!form.privacyAccepted ? 'Нужно подтвердить ознакомление с политикой конфиденциальности.' : '') ||
      (!form.offerAccepted ? 'Нужно принять условия договора оферты.' : '') ||
      (!form.consentsAccepted ? 'Нужно подтвердить все обязательные согласия.' : '');

    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);

    const isInpocket = form.paymentProvider === 'inpocket';
    // Открываем вкладку синхронно по клику, чтобы браузер не заблокировал popup,
    // и подставляем адрес после ответа сервера.
    const externalWindow = isInpocket ? window.open('about:blank', '_blank') : null;

    try {
      const response = await api.createPayment({
        courseId: selectedCourse.id,
        name: form.name,
        phone: form.phone,
        email: form.email,
        promo: form.promo.trim(),
        paymentProvider: form.paymentProvider,
      });

      sessionStorage.setItem('barmix:lastPaymentId', response.paymentId);
      sessionStorage.setItem('barmix:lastOrderId', response.orderId);
      sessionStorage.setItem('barmix:lastCourseTitle', selectedCourse.title);

      if (isInpocket) {
        if (externalWindow) {
          externalWindow.location.href = response.paymentUrl;
        } else {
          window.open(response.paymentUrl, '_blank', 'noopener,noreferrer');
        }

        setLoading(false);
        setSuccess(
          'Заявка отправлена, кабинет Inpocket открыт в новой вкладке. Мы свяжемся с вами для подтверждения участия.',
        );
        return;
      }

      window.location.assign(response.paymentUrl);
    } catch (paymentError) {
      externalWindow?.close();
      setError(paymentError instanceof Error ? paymentError.message : 'Не удалось создать платеж.');
      setLoading(false);
    }
  }

  return (
    <>
      <Seo
        title="Оплата участия"
        description="Оплата участия в интенсиве BarMixHub: карты, СБП, T-Pay, рассрочка через T-Банк, Яндекс Сплит и Inpocket."
        canonicalPath="/oplata"
        noindex
      />
      <PageHero
        eyebrow="оплата"
        title="Запись и оплата участия"
        text="Выберите интенсив, оставьте контакты и перейдите к безопасной оплате или оформлению рассрочки."
      />

      <section className="section">
        <div className="container payment-layout">
          <Reveal className="payment-summary">
            <div className="payment-summary__hero">
              <div
                className="payment-summary__image"
                style={{ backgroundImage: `url('${selectedCourse.image}')` }}
              />
              <div>
                <SectionEyebrow>выбранный интенсив</SectionEyebrow>
                <h2>{selectedCourse.title}</h2>
                <p>{selectedCourse.summary}</p>
              </div>
            </div>

            <div className="payment-summary__details">
              <div>
                <small>Формат</small>
                <strong>{selectedCourse.format}</strong>
              </div>
              <div>
                <small>Длительность</small>
                <strong>{selectedCourse.duration}</strong>
              </div>
              <div>
                <small>Стоимость</small>
                <strong>{formatPrice(selectedCourse.price)}</strong>
              </div>
            </div>

            <ul className="check-list check-list--compact">
              {selectedCourse.modules.map((module) => (
                <li key={module}>
                  <BadgeCheck size={18} />
                  {module}
                </li>
              ))}
            </ul>

            <div className="trust-list">
              <span>
                <ShieldCheck size={18} />
                защищенный переход к оплате
              </span>
              <span>
                <CreditCard size={18} />
                статусы оплаты, рассрочки и подтверждение участия
              </span>
              <span>
                <Mail size={18} />
                поддержка по почте и телефону
              </span>
            </div>
          </Reveal>

          <Reveal className="payment-card pattern-panel" delay={0.1}>
            <div className="payment-card__header">
              <SectionEyebrow>оформление участия</SectionEyebrow>
              <h3>Оформить участие</h3>
              <p>
                После оплаты или оформления рассрочки вы получите подтверждение и дальнейшие детали по
                выбранному интенсиву.
              </p>
            </div>

            <form className="payment-form" onSubmit={handleSubmit}>
              <label>
                <span>Интенсив</span>
                <select
                  value={selectedCourseId}
                  onChange={(event) => {
                    const nextCourseId = event.target.value;
                    setSelectedCourseId(nextCourseId);
                    setSearchParams({ course: nextCourseId });
                  }}
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} — {formatPrice(course.price)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Имя</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Как к вам обращаться"
                />
              </label>

              <div className="payment-form__row">
                <label>
                  <span>Телефон</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+7"
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="name@email.ru"
                  />
                </label>
              </div>

              <label>
                <span>Промокод</span>
                <input
                  type="text"
                  value={form.promo}
                  onChange={(event) => setForm((current) => ({ ...current, promo: event.target.value.toUpperCase() }))}
                  placeholder="Если есть"
                />
              </label>

              <div className="provider-list">
                <span className="provider-list__label">Способ оплаты</span>
                <div className="provider-list__items">
                  {(providers.length ? providers : fallbackProviders).map((provider) => {
                    const isDisabled = provider.available === false;
                    const isActive = provider.code === form.paymentProvider;

                    return (
                      <button
                        key={provider.code}
                        type="button"
                        disabled={isDisabled}
                        title={isDisabled ? 'Способ оплаты временно недоступен' : undefined}
                        className={[
                          'provider-chip',
                          isActive ? 'provider-chip--active' : '',
                          isDisabled ? 'provider-chip--disabled' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() =>
                          setForm((current) => ({ ...current, paymentProvider: provider.code }))
                        }
                      >
                        <strong>{provider.name}</strong>
                        <small>{isDisabled ? 'временно недоступно' : provider.methods.join(' / ')}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="payment-legal">
                <p className="payment-legal__title">Документы перед оплатой</p>

                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.privacyAccepted}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, privacyAccepted: event.target.checked }))
                    }
                  />
                  <span>
                    Я ознакомлен(а) с{' '}
                    <Link to="/privacy" target="_blank" rel="noreferrer">
                      политикой конфиденциальности
                    </Link>
                    .
                  </span>
                </label>

                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.offerAccepted}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, offerAccepted: event.target.checked }))
                    }
                  />
                  <span>
                    Я принимаю условия{' '}
                    <Link to="/offer" target="_blank" rel="noreferrer">
                      договора оферты
                    </Link>
                    .
                  </span>
                </label>

                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.consentsAccepted}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, consentsAccepted: event.target.checked }))
                    }
                  />
                  <span>
                    Я подтверждаю следующие согласия:{' '}
                    {consentDocuments.map((document, index) => (
                      <span key={document.to}>
                        <Link to={document.to} target="_blank" rel="noreferrer">
                          {document.label}
                        </Link>
                        {index < consentDocuments.length - 1 ? '; ' : '.'}
                      </span>
                    ))}
                  </span>
                </label>
              </div>

              {error ? <p className="form-state form-state--error">{error}</p> : null}
              {success ? (
                <p className="form-state form-state--success">
                  {success}{' '}
                  <a href="https://cabinet.inpocket.ru/auth/login" target="_blank" rel="noreferrer">
                    Открыть кабинет Inpocket
                  </a>
                  , если вкладка не открылась.
                </p>
              ) : null}

              <button
                className="button button--dark payment-form__submit"
                type="submit"
                disabled={loading || !allAgreementsAccepted}
              >
                {loading
                  ? 'Создаем заявку...'
                  : installmentProviders.has(form.paymentProvider)
                    ? `Оформить рассрочку · ${formatPrice(selectedCourse.price)}`
                    : `Перейти к оплате · ${formatPrice(selectedCourse.price)}`}
              </button>

              {form.paymentProvider === 'inpocket' ? (
                <p className="payment-form__hint">
                  После отправки заявки вы перейдете в личный кабинет Inpocket, где оформляется
                  рассрочка. Мы получим вашу заявку и свяжемся с вами для подтверждения участия.
                </p>
              ) : null}

              <div className="payment-help">
                <span>{config?.merchant_name ?? 'BarMixHub'}</span>
                <span>{config?.support_email ?? 'barmixhub@mail.ru'}</span>
                <span>
                  {config?.payment_enabled === false
                    ? 'Запись по заявке также доступна'
                    : 'Онлайн-оплата и рассрочка доступны'}
                </span>
              </div>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}
