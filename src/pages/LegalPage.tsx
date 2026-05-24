import { PageHero } from '../components/PageHero';
import { Seo } from '../components/Seo';
import { legalDocuments, type LegalDocumentType } from '../data/legal';

type LegalPageProps = {
  type: LegalDocumentType;
};

export function LegalPage({ type }: LegalPageProps) {
  const document = legalDocuments[type];
  const canonicalPaths: Record<LegalDocumentType, string> = {
    privacy: '/privacy',
    offer: '/offer',
    consent: '/consent',
    mailing: '/mailing-consent',
    distribution: '/distribution-consent',
  };

  return (
    <>
      <Seo
        title={document.title}
        description={document.heroText}
        canonicalPath={canonicalPaths[type]}
      />
      <PageHero
        eyebrow="документы"
        title={document.title}
        text={document.heroText}
      />
      <section className="section">
        <div className="container legal-document">
          <div className="legal-card legal-card--header">
            <div>
              <p className="legal-card__eyebrow">{document.updatedAt}</p>
              <h2>{document.subtitle}</h2>
            </div>
            <div className="legal-meta">
              {document.meta.map((item) => (
                <p key={`${item.label}-${item.value}`}>
                  <strong>{item.label}:</strong> {item.value}
                </p>
              ))}
            </div>
          </div>

          {document.sections.map((section) => (
            <section key={section.heading} className="legal-card legal-section">
              <h3>{section.heading}</h3>

              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}

              {section.bullets ? (
                <ul className="legal-list">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}

              {section.table ? (
                <div className="legal-table-wrap">
                  <table className="legal-table">
                    <thead>
                      <tr>
                        {section.table.columns.map((column) => (
                          <th key={column}>{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row) => (
                        <tr key={row.join('|')}>
                          {row.map((cell) => (
                            <td key={cell}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {section.note ? <p className="legal-note">{section.note}</p> : null}
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
