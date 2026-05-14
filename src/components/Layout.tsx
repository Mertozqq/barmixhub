import { LogIn } from 'lucide-react';
import type { ReactNode } from 'react';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <a
        className="floating-cta"
        href="https://app.barmenschool.site/login"
        target="_blank"
        rel="noreferrer noopener"
      >
        <LogIn size={18} />
        Войти в систему
      </a>
    </div>
  );
}
