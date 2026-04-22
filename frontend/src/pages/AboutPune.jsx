import Sidebar from '../components/Sidebar.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import Notification from '../components/Notification.jsx';
import { ABOUT_PUNE_CONTENT } from '../assets/aboutData.js';
import {
  Bus,
  Car,
  GraduationCap,
  Music2,
  Sparkles,
  Train,
} from 'lucide-react';

import './AboutPune.css';

const getCulturalIcon = (title) => {
  const normalized = String(title || '').toLowerCase();
  if (normalized.includes('education') || normalized.includes('literature')) return GraduationCap;
  if (normalized.includes('music') || normalized.includes('arts')) return Music2;
  return Sparkles;
};

const getTransportIcon = (mode) => {
  const normalized = String(mode || '').toLowerCase();
  if (normalized.includes('metro') || normalized.includes('rail') || normalized.includes('train')) return Train;
  if (normalized.includes('auto')) return Car;
  return Bus;
};

const parseGaneshFestival = (description) => {
  const text = String(description || '');

  // We want: prefix paragraph (ending with "Ganpati:"), ordered list, then suffix paragraph.
  const marker = 'Ganpati:';
  const markerIndex = text.indexOf(marker);
  if (markerIndex === -1) return null;

  const prefix = text.slice(0, markerIndex + marker.length).trim();
  const rest = text.slice(markerIndex + marker.length).trim();

  const suffixMarker = 'It concludes';
  const suffixIndex = rest.indexOf(suffixMarker);

  const listChunk = (suffixIndex === -1 ? rest : rest.slice(0, suffixIndex)).trim();
  const suffix = (suffixIndex === -1 ? '' : rest.slice(suffixIndex)).trim();

  const items = [];
  // Match numbered items like "4. Tulshibaug, and 5. Kesari Wada.".
  // We stop on comma or period; the next item can be preceded by "and ".
  const re = /(\d+)\.\s*([^,.]+?)(?=,|\.(?:\s|$)|$)/g;
  let match;
  while ((match = re.exec(listChunk)) !== null) {
    const value = String(match[2] || '').trim().replace(/\.$/, '');
    if (value) items.push(value);
  }

  if (!prefix || items.length === 0) return null;

  return { prefix, items, suffix };
};

export default function AboutPune() {
  const { hero, history, culturalIdentity, festivals, transport } = ABOUT_PUNE_CONTENT;

  const festivalFallbackImage = hero?.backgroundImage || '';

  const historyLeft = Array.isArray(history?.content) ? history.content.slice(0, 2) : [];
  const historyRight = Array.isArray(history?.content) ? history.content.slice(2, 3) : [];

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content about-main-content">
        <Breadcrumb />

        <div className="max-w-7xl mx-auto about-container">
          {/* I. Hero Header Section */}
          <section
            className="about-hero"
            style={{
              backgroundImage: hero?.backgroundImage ? `url(${hero.backgroundImage})` : 'none',
              backgroundColor: 'var(--surface-high)',
            }}
            aria-label={hero?.title || 'About Pune'}
          >
            <div className="about-hero-overlay" />
            <div className="about-hero-content">
              <h1 className="about-hero-title">{hero?.title}</h1>
              <p className="about-hero-subtitle">{hero?.subtitle}</p>
            </div>
          </section>

          {/* II. Historical Context Section */}
          <section className="about-section" aria-label={history?.title || 'History'}>
            <h2 className="about-section-title">{history?.title}</h2>

            <div className="about-history-grid">
              <div className="about-history-col">
                {historyLeft.map((para) => (
                  <p key={para} className="about-paragraph">{para}</p>
                ))}
              </div>
              <div className="about-history-col about-history-col--right">
                {historyRight.map((para) => (
                  <p key={para} className="about-paragraph">{para}</p>
                ))}
              </div>
            </div>
          </section>

          {/* III. Cultural Feature Grid */}
          <section className="about-section" aria-label="Cultural Identity">
            <h2 className="about-section-title">Cultural Identity</h2>

            <div className="about-cultural-grid">
              {Array.isArray(culturalIdentity) && culturalIdentity.map((item) => {
                const Icon = getCulturalIcon(item?.title);
                return (
                  <article key={item?.title} className="about-card">
                    <div className="about-card-icon" aria-hidden="true">
                      <Icon size={22} />
                    </div>
                    <h3 className="about-card-title">{item?.title}</h3>
                    <p className="about-paragraph">{item?.details}</p>
                  </article>
                );
              })}
            </div>
          </section>

          {/* IV. Major Events & Traditions (Zig-Zag Layout) */}
          <section className="about-section" aria-label="Major Events & Traditions">
            <h2 className="about-section-title">Major Events &amp; Traditions</h2>

            <div className="about-festival-stack">
              {Array.isArray(festivals) && festivals.map((f, idx) => {
                const isReverse = idx % 2 === 1;
                const ganeshParsed = f?.title === 'Ganesh Festival'
                  ? parseGaneshFestival(f?.description)
                  : null;

                return (
                  <article
                    key={f?.title}
                    className={isReverse ? 'about-festival about-festival--reverse' : 'about-festival'}
                  >
                    <div className="about-festival-media">
                      <div className="about-aspect-video">
                        <img
                          src={f?.image}
                          alt={f?.title || 'Festival'}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="about-image"
                          onError={(e) => {
                            if (e.currentTarget.dataset.fallbackApplied === '1') return;
                            e.currentTarget.dataset.fallbackApplied = '1';

                            if (festivalFallbackImage) {
                              e.currentTarget.src = festivalFallbackImage;
                              return;
                            }

                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>

                    <div className="about-festival-text">
                      <h3 className="about-festival-title">{f?.title}</h3>

                      {ganeshParsed ? (
                        <>
                          <p className="about-paragraph">{ganeshParsed.prefix}</p>
                          <ol className="about-ol">
                            {ganeshParsed.items.map((name) => (
                              <li key={name}>{name}</li>
                            ))}
                          </ol>
                          {ganeshParsed.suffix && (
                            <p className="about-paragraph">{ganeshParsed.suffix}</p>
                          )}
                        </>
                      ) : (
                        <p className="about-paragraph">{f?.description}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* V. Transportation Infrastructure Section */}
          <section className="about-transport" aria-label="Transportation Infrastructure">
            <div className="about-transport-inner">
              <h2 className="about-section-title about-section-title--tight">Transportation Infrastructure</h2>

              <div className="about-transport-grid">
                {Array.isArray(transport) && transport.map((t) => {
                  const Icon = getTransportIcon(t?.mode);
                  return (
                    <div key={t?.mode} className="about-transport-item">
                      <div className="about-transport-ic" aria-hidden="true">
                        <Icon size={20} />
                      </div>
                      <div className="about-transport-txt">
                        <span className="about-transport-mode">{t?.mode}</span>
                        <span className="about-transport-desc">{t?.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Notification />
    </div>
  );
}
