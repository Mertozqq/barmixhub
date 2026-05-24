import { Star } from 'lucide-react';
import { startTransition, useDeferredValue, useState } from 'react';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/Reveal';
import { Seo } from '../components/Seo';
import { reviews } from '../data/content';

export function ReviewsPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const visibleReviews = reviews.filter((item) => {
    const haystack = `${item.name} ${item.role} ${item.text}`.toLowerCase();
    return haystack.includes(deferredQuery.trim().toLowerCase());
  });

  return (
    <>
      <Seo
        title="\u041e\u0442\u0437\u044b\u0432\u044b \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432"
        description="\u041e\u0442\u0437\u044b\u0432\u044b \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432 BarMixHub \u043e \u0444\u043e\u0440\u043c\u0430\u0442\u0435, \u0430\u0442\u043c\u043e\u0441\u0444\u0435\u0440\u0435 \u0438 \u043b\u0438\u0447\u043d\u043e\u043c \u043e\u043f\u044b\u0442\u0435 \u043d\u0430 \u0438\u043d\u0442\u0435\u043d\u0441\u0438\u0432\u0435."
        canonicalPath="/reviews"
      />
      <PageHero
        eyebrow="отзывы"
        title="Отзывы участников"
        text="Опыт тех, кто уже был на наших встречах и интенсивах, лучше всего показывает, как этот формат ощущается изнутри."
      />

      <section className="section">
        <div className="container reviews-toolbar">
          <label className="search-field">
            <span>Поиск по отзывам</span>
            <input
              type="text"
              value={query}
              onChange={(event) => {
                const nextValue = event.target.value;
                startTransition(() => setQuery(nextValue));
              }}
              placeholder="Имя, роль или фраза"
            />
          </label>
        </div>
      </section>

      <section className="section section--dense">
        <div className="container reviews-grid">
          {visibleReviews.map((review, index) => (
            <Reveal key={review.name} className="review-card" delay={index * 0.05}>
              <div aria-label="Рейтинг 5 из 5">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star key={`${review.name}-${starIndex}`} size={18} fill="currentColor" />
                ))}
              </div>
              <p>{review.text}</p>
              <div className="review-card__author">
                <strong>{review.name}</strong>
                <span>{review.role}</span>
              </div>
            </Reveal>
          ))}
          {visibleReviews.length === 0 ? (
            <div className="empty-state">По этому запросу отзывов пока не найдено.</div>
          ) : null}
        </div>
      </section>
    </>
  );
}
