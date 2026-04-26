import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { privacyPolicy } from '../content/privacyPolicy';
import './PrivacyPage.css';

function PrivacyPage() {
  const footerRef = useRef<HTMLElement | null>(null);
  const { meta, sections } = privacyPolicy;

  return (
    <div className="privacy-page">
      <Header />
      <main className="privacy-main">
        <div className="privacy-inner">
          <Link to="/" className="privacy-back">
            ← Back to home
          </Link>

          <p className="privacy-kicker">Rihla · {meta.region}</p>
          <h1 className="privacy-title">{meta.title}</h1>
          <p className="privacy-subtitle">{meta.subtitle}</p>
          <p className="privacy-description">{meta.description}</p>

          <div className="privacy-meta-row" aria-label="Policy metadata">
            <span className="privacy-meta-item">
              <strong>Effective</strong> · {meta.effectiveDate}
            </span>
            <span className="privacy-meta-item">
              <strong>Region</strong> · {meta.region}
            </span>
          </div>

          <nav className="privacy-toc" aria-labelledby="privacy-toc-heading">
            <p id="privacy-toc-heading" className="privacy-toc-title">
              On this page
            </p>
            <ul className="privacy-toc-list">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    {s.number} · {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="privacy-section"
              aria-labelledby={`heading-${section.id}`}
            >
              <div className="privacy-section-header">
                <span className="privacy-section-number" aria-hidden>
                  {section.number}
                </span>
                <h2
                  className="privacy-section-title"
                  id={`heading-${section.id}`}
                >
                  {section.title}
                </h2>
              </div>
              {section.blocks.map((block, i) => (
                <article
                  key={`${section.id}-${i}-${block.subtitle}`}
                  className="privacy-block"
                >
                  <h3 className="privacy-block-subtitle">{block.subtitle}</h3>
                  <p className="privacy-block-text">{block.text}</p>
                </article>
              ))}
            </section>
          ))}
        </div>
      </main>
      <div className="privacy-footer-spacer">
        <Footer footerRef={footerRef} />
      </div>
    </div>
  );
}

export default PrivacyPage;
