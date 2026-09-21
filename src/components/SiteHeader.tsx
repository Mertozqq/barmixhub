import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { navLinks } from '../data/content';

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTelegramWebView, setIsTelegramWebView] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const currentWindow = window as Window & {
      TelegramWebviewProxy?: unknown;
      Telegram?: { WebApp?: unknown };
    };
    const userAgent = navigator.userAgent || '';
    const hasTelegramBridge =
      Boolean(currentWindow.TelegramWebviewProxy) || Boolean(currentWindow.Telegram?.WebApp);
    const hasTelegramUserAgent = /Telegram/i.test(userAgent);
    const hasTelegramQuery = window.location.search.includes('tgWebAppPlatform');
    const hasTelegramReferrer = document.referrer.includes('t.me');
    const nextIsTelegramWebView =
      hasTelegramBridge || hasTelegramUserAgent || hasTelegramQuery || hasTelegramReferrer;

    setIsTelegramWebView(nextIsTelegramWebView);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className={`site-header ${isTelegramWebView ? 'site-header--static' : ''}`}>
      <div className="container site-header__inner">
        <Link className="brand" to="/">
          <span className="brand__mark">BM</span>
          <span>
            <strong>BarMixHub</strong>
            <small>Барное пространство</small>
          </span>
        </Link>

        <button
          type="button"
          className="menu-button"
          onClick={() => setMenuOpen(true)}
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menuOpen}
          aria-controls="site-nav"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav id="site-nav" className={`site-nav ${menuOpen ? 'site-nav--open' : ''}`}>
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to === '/contact' ? '/about' : item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                isActive ? 'site-nav__link site-nav__link--active' : 'site-nav__link'
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            className="button button--sm button--primary site-nav__cta"
            to="/oplata?course=bar-foundation"
            onClick={() => setMenuOpen(false)}
          >
            Записаться
          </Link>
        </nav>
      </div>
    </header>
  );
}
