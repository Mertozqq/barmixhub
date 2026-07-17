function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isInpocketConfigured(env) {
  return env.enabled && hasValue(env.url);
}

export function assertInpocketConfigured(env) {
  if (isInpocketConfigured(env)) {
    return;
  }

  throw new Error('Рассрочка Inpocket сейчас недоступна.');
}

export function getInpocketProviderMeta(env) {
  return {
    code: 'inpocket',
    name: 'Inpocket',
    methods: ['Рассрочка'],
    description: 'Оформление рассрочки в личном кабинете Inpocket. Мы получим вашу заявку и поможем с оформлением.',
    available: isInpocketConfigured(env),
  };
}

export function getInpocketPaymentUrl(env) {
  return env.url;
}
