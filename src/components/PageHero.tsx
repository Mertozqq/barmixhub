import { Reveal } from './Reveal';
import { SectionEyebrow } from './SectionHeading';

type PageHeroProps = {
  eyebrow: string;
  title: string;
  text: string;
};

export function PageHero({ eyebrow, title, text }: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="container">
        <Reveal className="page-hero__card">
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <h1>{title}</h1>
          <p>{text}</p>
        </Reveal>
      </div>
    </section>
  );
}
