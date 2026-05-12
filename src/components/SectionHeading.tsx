import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="section-eyebrow">{children}</p>;
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  text: string;
};

export function SectionHeading({ eyebrow, title, text }: SectionHeadingProps) {
  return (
    <Reveal className="section-heading">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2>{title}</h2>
      <p>{text}</p>
    </Reveal>
  );
}
