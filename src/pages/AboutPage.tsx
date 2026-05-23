import { BookOpen, GlassWater, ShieldCheck } from 'lucide-react';
import { BadgeCheck } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/Reveal';
import { SectionEyebrow } from '../components/SectionHeading';

export function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="о проекте"
        title="Пространство, в котором в центре стоит реальная смена"
        text="BarMixHub работает на стыке вкуса, сервиса и дисциплины, чтобы участник уходил не просто вдохновленным, а более собранным и уверенным за стойкой."
      />

      <section className="section">
        <div className="container principles-grid">
          <Reveal className="principle-card">
            <GlassWater size={22} />
            <h3>Культура вкуса</h3>
            <p>
              Разбираем напиток не только как рецепт, но и как опыт гостя: баланс, подача, ритуал и
              настроение.
            </p>
          </Reveal>
          <Reveal className="principle-card" delay={0.08}>
            <BookOpen size={22} />
            <h3>Живой формат</h3>
            <p>
              Каждая тема должна работать в смене: на станции, в контакте с гостем, в команде и в
              реальном темпе.
            </p>
          </Reveal>
          <Reveal className="principle-card" delay={0.16}>
            <ShieldCheck size={22} />
            <h3>Сильная опора</h3>
            <p>
              Мы помогаем участнику не копировать чужой стиль, а собрать собственную уверенность и ясную
              манеру работы за стойкой.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container split-layout split-layout--reverse">
          <Reveal className="split-layout__visual">
            <div
              className="image-card image-card--tall"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(17,17,17,0.12), rgba(17,17,17,0.56)), url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80')",
              }}
            />
          </Reveal>
          <Reveal className="split-layout__copy" delay={0.1}>
            <SectionEyebrow>наш подход</SectionEyebrow>
            <h2>Нам важно, чтобы участник не играл роль, а чувствовал себя увереннее в реальном ритме бара</h2>
            <p>
              Поэтому в интенсиве много внимания к собранности, темпу, гостю, подаче и логике смены. Мы
              не отделяем стиль от дисциплины, а вкус от сервиса.
            </p>
            <ul className="check-list">
              <li>
                <BadgeCheck size={18} />
                честная рабочая среда без лишнего пафоса
              </li>
              <li>
                <BadgeCheck size={18} />
                внимание к человеку, а не только к технике
              </li>
              <li>
                <BadgeCheck size={18} />
                один формат, собранный для комфортного старта
              </li>
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}
