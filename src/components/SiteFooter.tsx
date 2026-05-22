import { Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { navLinks } from '../data/content';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <Link className="brand brand--footer" to="/">
            <span className="brand__mark">BM</span>
            <span>
              <strong>BarMix</strong>
              <small>барное пространство</small>
            </span>
          </Link>
          <p className="site-footer__text">
            BarMix — пространство барных встреч и интенсивов для тех, кто хочет спокойнее войти в
            индустрию и увереннее чувствовать себя в смене.
          </p>
        </div>

        <div>
          <p className="site-footer__title">Навигация</p>
          <div className="site-footer__links">
            {navLinks.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="site-footer__title">Документы</p>
          <div className="site-footer__links">
            <Link to="/consent">Согласие на обработку персональных данных</Link>
            <Link to="/offer">Договор оферты</Link>
          </div>
        </div>

        <div>
          <p className="site-footer__title">Контакты</p>
          <div className="site-footer__meta">
            <span>
              <Phone size={16} />
              +7 (917) 252-02-65
            </span>
            <span>
              <Mail size={16} />
              barmixhub@mail.ru
            </span>
            <span>
              <MapPin size={16} />
              Москва / офлайн и онлайн
            </span>
          </div>
        </div>

        <div>
          <p className="site-footer__title">Реквизиты</p>
          <div className="site-footer__meta">
            <span>ИП Хуснутдинова Эльвира Фаилевна</span>
            <span>ИНН: 636923943804</span>
            <span>ОГРНИП: 326632700080042</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
