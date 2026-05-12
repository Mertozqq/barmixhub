import { useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { validateEmail, validateMessage, validateName, validatePhone } from '../lib/validation';
import type { LeadPayload } from '../types';
import { SectionEyebrow } from './SectionHeading';

type ContactFormProps = {
  compact?: boolean;
  title?: string;
  subtitle?: string;
};

export function ContactForm({
  compact = false,
  title = 'Оставьте запрос',
  subtitle = 'Напишите, если хотите узнать подробнее об интенсиве, забронировать место в потоке или уточнить детали по участию.',
}: ContactFormProps) {
  const [form, setForm] = useState<LeadPayload>({ name: '', phone: '', email: '', message: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validation =
      validateName(form.name) ||
      validatePhone(form.phone) ||
      validateEmail(form.email) ||
      validateMessage(form.message);

    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    try {
      const response = await api.submitLead(form);
      setSuccess(response.message);
      setForm({ name: '', phone: '', email: '', message: '' });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Не удалось отправить форму.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`contact-card ${compact ? 'contact-card--compact' : ''}`}>
      <div>
        <SectionEyebrow>связь</SectionEyebrow>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="contact-form__grid">
          <input
            type="text"
            placeholder="Имя"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <input
            type="tel"
            placeholder="Телефон"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          />
          <input
            type="email"
            placeholder="Эл. почта"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
          <textarea
            placeholder="Расскажите, что хотите уточнить"
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          />
        </div>
        {error ? <p className="form-state form-state--error">{error}</p> : null}
        {success ? <p className="form-state form-state--success">{success}</p> : null}
        <button className="button button--primary" type="submit" disabled={loading}>
          {loading ? 'Отправляем...' : 'Отправить'}
        </button>
      </form>
    </div>
  );
}
