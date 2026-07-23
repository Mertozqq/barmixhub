import { CreditCard } from 'lucide-react';

type PaymentProviderIconProps = {
  code: string;
};

const providerIcons: Record<string, string> = {
  tbank: '/payment-icons/tbank.svg',
  'yandex-split': '/payment-icons/yandex.webp',
  podeli: '/payment-icons/alfa-bank.svg',
  inpocket: '/payment-icons/inpocket.svg',
};

export function PaymentProviderIcon({ code }: PaymentProviderIconProps) {
  const className = `provider-icon provider-icon--${code}`;
  const iconSrc = providerIcons[code];

  if (iconSrc) {
    return (
      <span className={className} aria-hidden="true">
        <img src={iconSrc} alt="" />
      </span>
    );
  }

  return (
    <span className={`${className} provider-icon--fallback`} aria-hidden="true">
      <CreditCard size={24} strokeWidth={1.8} />
    </span>
  );
}
