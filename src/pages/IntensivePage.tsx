import { CalendarDays, CreditCard } from 'lucide-react';
import { CourseCard } from '../components/CourseCard';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/Reveal';
import { Seo } from '../components/Seo';
import { SectionHeading } from '../components/SectionHeading';
import { courses } from '../data/content';
import { formatPrice } from '../lib/format';

export function IntensivePage() {
  const course = courses[0];

  return (
    <>
      <Seo
        title="\u0411\u0430\u0440\u043d\u044b\u0439 \u0438\u043d\u0442\u0435\u043d\u0441\u0438\u0432 \u2014 2 \u043d\u0435\u0434\u0435\u043b\u0438"
        description="\u041e\u0447\u043d\u044b\u0439 \u0431\u0430\u0440\u043d\u044b\u0439 \u0438\u043d\u0442\u0435\u043d\u0441\u0438\u0432 BarMixHub: 2 \u043d\u0435\u0434\u0435\u043b\u0438, \u0434\u0435\u043c\u043e\u043d\u0441\u0442\u0440\u0430\u0446\u0438\u0438, \u043f\u0440\u0430\u043a\u0442\u0438\u043a\u0430, \u0441\u0435\u0440\u0432\u0438\u0441 \u0438 \u0431\u0430\u0437\u043e\u0432\u0430\u044f \u0440\u0430\u0431\u043e\u0447\u0430\u044f \u0441\u0438\u0441\u0442\u0435\u043c\u0430 \u0431\u0430\u0440\u0430."
        canonicalPath="/intensive"
      />
      <PageHero
        eyebrow="интенсив"
        title="Текущий интенсив"
        text="Сейчас открыт один двухнедельный очный интенсив с демонстрациями, практикой, сервисом и базовой рабочей системой бара."
      />
      <section className="section">
        <div className="container course-grid">
          <CourseCard course={course} delay={0.06} />
        </div>
      </section>

      <section className="section section--dense">
        <div className="container">
          <SectionHeading
            eyebrow="что внутри"
            title="Что входит в интенсив"
            text="Ниже собрана структура встреч: от первого погружения в барную среду до сервиса, вкуса и рабочей системы."
          />

          <div className="detail-grid detail-grid--modules">
            {course.modules.map((module, index) => (
              <Reveal key={module} className="detail-card" delay={index * 0.05}>
                <p className="detail-card__eyebrow">Модуль {index + 1}</p>
                <h3>{module}</h3>
                <p>{index === 0 ? course.audience : index === course.modules.length - 1 ? course.result : course.summary}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="intensive-summary" delay={0.08}>
            <div className="intensive-summary__item">
              <CalendarDays size={16} />
              <div>
                <small>Длительность</small>
                <strong>{course.duration}</strong>
              </div>
            </div>
            <div className="intensive-summary__item">
              <CreditCard size={16} />
              <div>
                <small>Стоимость</small>
                <strong>{formatPrice(course.price)}</strong>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
