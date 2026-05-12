import { Menu, X } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { navLinks } from '../data/content';

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const closeMenu = useEffectEvent(() => setMenuOpen(false));

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link className="brand" to="/">
          <span className="brand__mark">BM</span>
          <span>
            <strong>BarMix</strong>
            <small>барное пространство</small>
          </span>
        </Link>

        <button
          type="button"
          className="menu-button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label="Открыть меню"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={`site-nav ${menuOpen ? 'site-nav--open' : ''}`}>
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'site-nav__link site-nav__link--active' : 'site-nav__link'
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link className="button button--sm button--primary site-nav__cta" to="/oplata?course=bar-foundation">
            Записаться
          </Link>
        </nav>
      </div>
    </header>
  );
}
