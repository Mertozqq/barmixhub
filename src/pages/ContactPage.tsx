import { Mail, MapPin, Phone, Users } from 'lucide-react';
import { ContactForm } from '../components/ContactForm';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/Reveal';
import { Seo } from '../components/Seo';

export function ContactPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: '\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b BarMixHub',
    url: 'https://barmixhub.ru/contact',
    mainEntity: {
      '@type': 'Organization',
      name: 'BarMixHub',
      telephone: '+7 (917) 252-02-65',
      email: 'barmixhub@mail.ru',
    },
  };

  return (
    <>
      <Seo
        title="\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b \u0438 \u043a\u043e\u043d\u0441\u0443\u043b\u044c\u0442\u0430\u0446\u0438\u0438"
        description="\u0421\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f \u0441 BarMixHub: \u0432\u043e\u043f\u0440\u043e\u0441\u044b \u043f\u043e \u0444\u043e\u0440\u043c\u0430\u0442\u0443, \u043e\u043f\u043b\u0430\u0442\u0435, \u0437\u0430\u043f\u0438\u0441\u0438 \u0438 \u0431\u043b\u0438\u0436\u0430\u0439\u0448\u0435\u043c\u0443 \u043f\u043e\u0442\u043e\u043a\u0443."
        canonicalPath="/contact"
        structuredData={structuredData}
      />
      <PageHero
        eyebrow="контакты"
        title="Контакты и консультации"
        text="Если хотите уточнить детали участия, задать вопрос по оплате или понять, подходит ли вам текущий поток, напишите нам удобным способом."
      />
      <section className="section">
        <div className="container contact-layout">
          <Reveal className="contact-meta">
            <div className="contact-meta__item">
              <Phone size={20} />
              <div>
                <strong>Телефон</strong>
                <p>+7 (917) 252-02-65</p>
              </div>
            </div>
            <div className="contact-meta__item">
              <Mail size={20} />
              <div>
                <strong>Эл. почта</strong>
                <p>barmixhub@mail.ru</p>
              </div>
            </div>
            <div className="contact-meta__item">
              <MapPin size={20} />
              <div>
                <strong>Формат</strong>
                <p>Москва / выездные встречи / онлайн</p>
              </div>
            </div>
            <div className="contact-meta__item">
              <Users size={20} />
              <div>
                <strong>Для кого</strong>
                <p>Для новичков и тех, кто только начинает знакомство с барной средой</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
