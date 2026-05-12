import { Star } from 'lucide-react';
import { startTransition, useDeferredValue, useState } from 'react';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/Reveal';
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
              <Star size={18} />
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
