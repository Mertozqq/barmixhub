import { BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/format';
import type { Course } from '../types';
import { Reveal } from './Reveal';

type CourseCardProps = {
  course: Course;
  delay?: number;
};

export function CourseCard({ course, delay = 0 }: CourseCardProps) {
  return (
    <Reveal className="course-card" delay={delay}>
      <div className="course-card__media" style={{ backgroundImage: `url('${course.image}')` }} />
      <div className="course-card__body">
        <div className="course-card__pill-row">
          <span className="pill">{course.format}</span>
          <span className="pill pill--muted">{course.duration}</span>
        </div>
        <h3>{course.title}</h3>
        <p>{course.summary}</p>
        <ul className="course-card__modules">
          {course.modules.map((module) => (
            <li key={module}>
              <BadgeCheck size={16} />
              {module}
            </li>
          ))}
        </ul>
        <div className="course-card__footer">
          <div>
            <small>Стоимость</small>
            <strong>{formatPrice(course.price)}</strong>
          </div>
          <Link className="button button--primary button--sm" to={`/oplata?course=${course.id}`}>
            Записаться
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
