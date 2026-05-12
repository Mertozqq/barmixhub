import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { IntensivePage } from './pages/IntensivePage';
import { LegalPage } from './pages/LegalPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentResultPage } from './pages/PaymentResultPage';
import { ReviewsPage } from './pages/ReviewsPage';

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/intensive" element={<IntensivePage />} />
        <Route path="/courses" element={<IntensivePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/contacts" element={<ContactPage />} />
        <Route path="/oplata" element={<PaymentPage />} />
        <Route path="/checkout" element={<PaymentPage />} />
        <Route path="/payment/success" element={<PaymentResultPage mode="success" />} />
        <Route path="/payment/fail" element={<PaymentResultPage mode="fail" />} />
        <Route path="/payment/pending" element={<PaymentResultPage mode="pending" />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/offer" element={<LegalPage type="offer" />} />
        <Route path="/consent" element={<LegalPage type="consent" />} />
        <Route path="/distribution-consent" element={<LegalPage type="distribution" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  );
}
