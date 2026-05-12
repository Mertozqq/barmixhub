import { Link } from 'react-router-dom';
import { PageHero } from '../components/PageHero';

export function NotFoundPage() {
  return (
    <>
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
