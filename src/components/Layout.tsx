import { CreditCard } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <Link className="floating-cta" to="/oplata?course=bar-foundation">
        <CreditCard size={18} />
        Забронировать место
      </Link>
    </div>
  );
}
