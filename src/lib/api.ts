import type {
  LeadPayload,
  PaymentConfig,
  PaymentCreateResponse,
  PaymentProvidersResponse,
  PaymentStatusResponse,
} from '../types';

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Не удалось выполнить запрос.');
  }

  return data as T;
}

export const api = {
  getPaymentConfig: () => fetchJson<PaymentConfig>('/api/payments/config'),
  getPaymentProviders: () => fetchJson<PaymentProvidersResponse>('/api/payments/providers'),
  getPaymentStatus: (paymentId: string) =>
    fetchJson<PaymentStatusResponse>(`/api/payments/status/${paymentId}`),
  submitLead: (payload: LeadPayload) =>
    fetchJson<{ message: string }>('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  createPayment: (payload: Record<string, unknown>) =>
    fetchJson<PaymentCreateResponse>('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};
