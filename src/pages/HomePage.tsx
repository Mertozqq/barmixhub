import { ArrowRight, BadgeCheck, CreditCard, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { startTransition } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CourseCard } from '../components/CourseCard';
import { FaqCard } from '../components/FaqCard';
import { Reveal } from '../components/Reveal';
import { SectionEyebrow, SectionHeading } from '../components/SectionHeading';
import { courses, curriculum, faqs, highlights, journey, stats } from '../data/content';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <Reveal className="hero-visual">
            <div
              className="image-card image-card--hero"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(17,17,17,0.12), rgba(17,17,17,0.72)), url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80')",
              }}
            />
          </Reveal>

          <Reveal className="hero-copy" delay={0.15}>
            <SectionEyebrow>bar mix / москва</SectionEyebrow>
            <h1>Барный интенсив, где важны и вкус, и сервис, и спокойствие в смене</h1>
            <p>
              BarMixHub собирает живой формат для новичков и тех, кто только начинает знакомство с барной
              средой. Без лишнего шума, с вниманием к ритму, подаче и уверенности за стойкой.
            </p>

            <div className="hero-copy__actions">
              <Link className="button button--primary" to="/intensive">
                Смотреть интенсив
              </Link>
              <Link className="button button--ghost" to="/contact">
                Задать вопрос
              </Link>
            </div>

            <div className="hero-meta">
              <span>Москва / онлайн</span>
              <span>Один интенсив с сильной базой</span>
              <span>Оплата картой, СБП, T-Pay и рассрочка</span>
            </div>

            <div className="hero-schedule">
              <div>
                <strong>Формат</strong>
                <p>Один двухнедельный интенсив с очными встречами и демонстрациями</p>
              </div>
              <div>
                <strong>Для кого</strong>
                <p>Для новичков и тех, кто хочет спокойнее войти в барную среду</p>
              </div>
            </div>

            <button
              type="button"
              className="hero-scroll"
              onClick={() => {
                startTransition(() => navigate('/oplata?course=bar-foundation'));
              }}
            >
              Забронировать место
              <ArrowRight size={18} />
            </button>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container feature-strip">
          {highlights.map((item, index) => (
            <Reveal key={item.title} className="feature-card" delay={index * 0.08}>
              <Sparkles size={18} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container split-layout">
          <Reveal className="split-layout__copy">
            <SectionEyebrow>о проекте</SectionEyebrow>
            <h2>Здесь собирают вкус, сервис и рабочую собранность в одном ритме</h2>
            <p>
              В центре внимания не только коктейль, но и то, как выглядит сильная смена: организация
              станции, контакт с гостем, подача, темп и уверенность в каждом движении.
            </p>
            <ul className="check-list">
              <li>
                <BadgeCheck size={18} />
                реальные сменовые сценарии
              </li>
              <li>
                <BadgeCheck size={18} />
                спокойный вход в барную среду без перегруза
              </li>
              <li>
                <BadgeCheck size={18} />
                один интенсив, собранный под уверенный старт
              </li>
            </ul>
            <Link className="button button--ghost" to="/about">
              Подробнее
            </Link>
          </Reveal>

          <Reveal className="split-layout__visual" delay={0.1}>
            <div
              className="image-card image-card--tall"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(17,17,17,0.2), rgba(17,17,17,0.62)), url('https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?auto=format&fit=crop&w=1000&q=80')",
              }}
            />
          </Reveal>
        </div>
      </section>

      <section className="section section--dense">
        <div className="container spotlight">
          <Reveal className="spotlight__image">
            <div
              className="image-card image-card--wide"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(17,17,17,0.12), rgba(17,17,17,0.48)), url('https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=1400&q=80')",
              }}
            />
          </Reveal>
          <Reveal className="spotlight__copy pattern-panel" delay={0.1}>
            <SectionEyebrow>подход</SectionEyebrow>
            <h2>Интенсив собран так, чтобы первый вход в барную среду был спокойным и понятным</h2>
            <p>
              Без лишней декоративности. С сильной базой, внятными разборами и вниманием к тому, как
              участник чувствует себя в настоящем ритме бара.
            </p>
            <Link className="button button--dark" to="/intensive">
              Смотреть структуру встреч
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="путь участника"
            title="Как проходит участие"
            text="Путь через интенсив строится от первого знакомства с форматом до более уверенного поведения в реальной смене."
          />
          <div className="journey-grid">
            {journey.map((item, index) => (
              <Reveal key={item.title} className="journey-card" delay={index * 0.08}>
                <span className="journey-card__index">0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--dense">
        <div className="container curriculum-section">
          <Reveal className="curriculum-heading">
            <SectionEyebrow>внутри интенсива</SectionEyebrow>
            <h2>Что входит в интенсив</h2>
          </Reveal>

          <Reveal className="pattern-panel curriculum-board" delay={0.1}>
            {curriculum.map((column) => (
              <div key={column.title}>
                <h3>{column.title}</h3>
                <ul>
                  {column.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
            <Link className="button button--dark curriculum-board__cta" to="/oplata?course=bar-foundation">
              Смотреть интенсив
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="интенсив"
            title="Текущий поток"
            text="Один поток, одна собранная структура встреч и понятный маршрут от интереса к уверенности за стойкой."
          />
          <div className="course-grid">
            {courses.map((course, index) => (
              <CourseCard key={course.id} course={course} delay={index * 0.08} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stats-grid">
          {stats.map((item, index) => (
            <Reveal key={item.label} className="stat-card" delay={index * 0.08}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="вопросы и ответы"
            title="Частые вопросы"
            text="Если хотите уточнить детали перед записью, здесь собраны самые важные ответы."
          />
          <div className="faq-list">
            {faqs.map((item, index) => (
              <FaqCard key={item.question} item={item} delay={index * 0.04} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--dense">
        <div className="container trust-line">
          <Reveal className="trust-line__items">
            <span>
              <ShieldCheck size={18} />
              безопасная оплата
            </span>
            <span>
              <CreditCard size={18} />
              карты, СБП, T-Pay и рассрочка
            </span>
            <span>
              <Mail size={18} />
              подтверждение участия после записи
            </span>
          </Reveal>
        </div>
      </section>
    </>
  );
}
