import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { FaqItem } from '../types';
import { Reveal } from './Reveal';

type FaqCardProps = {
  item: FaqItem;
  delay?: number;
};

export function FaqCard({ item, delay = 0 }: FaqCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Reveal className="faq-card" delay={delay}>
      <button type="button" className="faq-card__button" onClick={() => setOpen(true)}>
        <span>{item.question}</span>
        <ChevronDown size={18} className={open ? 'faq-card__icon faq-card__icon--open' : 'faq-card__icon'} />
      </button>
      {open ? <p className="faq-card__answer">{item.answer}</p> : null}
    </Reveal>
  );
}
