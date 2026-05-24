import { Link } from 'react-router-dom';
import { PageHero } from '../components/PageHero';
import { Seo } from '../components/Seo';

export function NotFoundPage() {
  return (
    <>
      <Seo
        title="\u0421\u0442\u0440\u0430\u043d\u0438\u0446\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430"
        description="\u0421\u043b\u0443\u0436\u0435\u0431\u043d\u0430\u044f \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0430 404."
        noindex
      />
      <PageHero
        eyebrow="404"
        title="Страница не найдена"
        text="Можно вернуться на главную или перейти к интенсиву и записи."
      />
      <section className="section">
        <div className="container result-card-wrap">
          <div className="result-card">
            <div className="result-card__actions">
              <Link className="button button--primary" to="/">
                На главную
              </Link>
              <Link className="button button--ghost" to="/intensive">
                К интенсиву
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
