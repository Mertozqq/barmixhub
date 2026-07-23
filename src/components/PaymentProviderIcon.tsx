import { CreditCard } from 'lucide-react';

type PaymentProviderIconProps = {
  code: string;
};

export function PaymentProviderIcon({ code }: PaymentProviderIconProps) {
  const className = `provider-icon provider-icon--${code}`;

  if (code === 'tbank') {
    return (
      <span className={className} aria-hidden="true">
        <svg viewBox="0 0 29 34" fill="none">
          <path
            d="M0 3h29v14.585a10.47 10.47 0 0 1-5.232 9.064L14.5 32l-9.268-5.351A10.47 10.47 0 0 1 0 17.585V3Z"
            fill="#ffdd2d"
          />
          <path
            fill="#333"
            fillRule="evenodd"
            d="M8 11v4.558c.616-.704 1.737-1.18 3.019-1.18h1.392v5.299c0 1.41-.379 2.644-.941 3.323h6.058c-.561-.68-.939-1.912-.939-3.32v-5.302h1.392c1.282 0 2.403.476 3.019 1.18V11H8Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }

  if (code === 'yandex-split') {
    return (
      <span className={className} aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="17.5" fill="#fc3f1d" />
          <path
            d="M22.4 8.5h-4.1c-4.7 0-8.1 2.9-8.1 7.2 0 3.4 1.8 5.7 5.1 7.4l-6 8.4h5.4l5.5-7.8h1.9v7.8h4.5v-23h-4.2Zm-.3 11.6h-2.6c-2.8 0-4.6-1.5-4.6-4.1 0-2.7 1.9-4 4.6-4h2.6v8.1Z"
            fill="#fff"
          />
        </svg>
      </span>
    );
  }

  if (code === 'podeli') {
    return (
      <span className={className} aria-hidden="true">
        <svg viewBox="0 0 96.2 146.4" fill="none">
          <rect y="126.41" width="96.2" height="19.99" fill="#ef3124" />
          <path
            d="M65.59 14.64C62.84 6.46 59.68 0 48.85 0S34.65 6.43 31.77 14.64L2 99.25h19.74l6.87-20.11h37.98l6.37 20.11h20.99L65.59 14.64ZM34.36 62.15l13.49-40.1h.5l12.74 40.1H34.36Z"
            fill="#ef3124"
          />
        </svg>
      </span>
    );
  }

  if (code === 'inpocket') {
    return (
      <span className={className} aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <circle cx="10.5" cy="9" r="2.8" fill="#e2ff32" />
          <rect x="8" y="14" width="5" height="18" rx="2.5" fill="#e2ff32" />
          <path
            d="M19 31.5V15.5m0 7.5c0-4.5 2.65-7.5 6.4-7.5 4.1 0 6.6 2.85 6.6 7.5v8.5"
            stroke="#e2ff32"
            strokeLinecap="round"
            strokeWidth="5"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className={`${className} provider-icon--fallback`} aria-hidden="true">
      <CreditCard size={24} strokeWidth={1.8} />
    </span>
  );
}
