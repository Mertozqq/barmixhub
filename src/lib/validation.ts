export function validateName(value: string) {
  const name = value.trim();
  if (name.length <= 2) return 'Введите имя не короче 2 символов.';
  if (name.length > 60) return 'Имя не должно быть длиннее 60 символов.';
  return '';
}

export function validatePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 'Введите номер телефона.';
  if (digits.length < 10 || digits.length > 15) return 'Введите корректный номер телефона.';
  return '';
}

export function validateEmail(value: string) {
  const email = value.trim();
  if (!email) return 'Введите email.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Введите корректный email.';
  return '';
}

export function validateMessage(value: string) {
  return value.trim().length > 800 ? 'Комментарий не должен превышать 800 символов.' : '';
}
