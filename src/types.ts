export type Course = {
  id: string;
  title: string;
  format: string;
  duration: string;
  price: number;
  audience: string;
  summary: string;
  result: string;
  image: string;
  modules: string[];
};

export type Review = {
  name: string;
  role: string;
  text: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type PaymentProvider = {
  code: string;
  name: string;
  methods: string[];
  description: string;
};

export type LeadPayload = {
  name: string;
  phone: string;
  email: string;
  message: string;
};

export type PaymentFormState = {
  name: string;
  phone: string;
  email: string;
  promo: string;
  agreement: boolean;
  paymentProvider: string;
};

export type PaymentConfig = {
  payment_enabled: boolean;
  support_email: string;
  support_phone: string;
  merchant_name: string;
  default_provider: string;
};

export type PaymentProvidersResponse = {
  default_provider: string;
  providers: PaymentProvider[];
};

export type PaymentCreateResponse = {
  success: boolean;
  paymentId: string;
  orderId: string;
  paymentUrl: string;
};

export type PaymentStatusResponse = {
  success: boolean;
  paymentId: string;
  orderId?: string;
  status: string;
  amount?: number;
  paymentUrl?: string | null;
};
