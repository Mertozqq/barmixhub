import { Mail, MapPin, Phone, Users } from 'lucide-react';
import { ContactForm } from '../components/ContactForm';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/Reveal';
import { Seo } from '../components/Seo';

export function ContactPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Контакты BarMixHub',
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
        title="Контакты и консультации"
        description="Связаться с BarMixHub: вопросы по формату, оплате, записи и ближайшему потоку."
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
