import { useTranslation } from 'react-i18next';
import LangSwitcher from '../components/LangSwitcher';
import { useSEO } from '../hooks/useSEO';

const FEATURES = ['f1', 'f2', 'f3', 'f4'];
const USE_CASES = [
  { key: 'uc1', icon: '🍽️' },
  { key: 'uc2', icon: '🛍️' },
  { key: 'uc3', icon: '🎪' },
];
const FAQ_KEYS = ['1', '2', '3', '4'];

export default function Landing() {
  const { t } = useTranslation();

  useSEO({
    titleKey: 'landing.seo.title',
    descKey: 'landing.seo.description',
  });

  const handleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Shifter',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
        description: t('landing.seo.description'),
        url: 'https://shifter.pages.dev/',
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ_KEYS.map((n) => ({
          '@type': 'Question',
          name: t(`landing.faq.q${n}`),
          acceptedAnswer: { '@type': 'Answer', text: t(`landing.faq.a${n}`) },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-main)' }}>
        {/* ── Nav ── */}
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <span className="font-heading font-bold text-lg text-primary">Shifter</span>
            <div className="flex items-center gap-4">
              <LangSwitcher />
              <button
                onClick={handleLogin}
                className="btn btn-primary py-2 px-4 text-sm"
              >
                {t('auth.login')}
              </button>
            </div>
          </div>
        </header>

        <main>
          {/* ── Hero ── */}
          <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
            <span
              className="inline-block mb-4 px-3 py-1 text-xs font-medium rounded-full"
              style={{ background: 'var(--secondary)', color: 'var(--primary)' }}
            >
              {t('landing.hero.free_badge')}
            </span>
            <h1
              className="font-heading font-bold leading-tight mb-6"
              style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'var(--text-primary)' }}
            >
              {t('landing.hero.headline')}
            </h1>
            <p
              className="max-w-xl mx-auto mb-8 leading-relaxed"
              style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}
            >
              {t('landing.hero.subheadline')}
            </p>
            <button
              onClick={handleLogin}
              className="btn btn-primary px-8 py-3 text-base inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#ffffff" opacity=".9"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ffffff" opacity=".9"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#ffffff" opacity=".9"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ffffff" opacity=".9"/>
              </svg>
              {t('landing.hero.cta')}
            </button>
          </section>

          {/* ── Features ── */}
          <section
            className="py-16"
            style={{ background: '#fff', borderTop: '1px solid var(--border-color)' }}
            aria-labelledby="features-heading"
          >
            <div className="max-w-5xl mx-auto px-4">
              <h2
                id="features-heading"
                className="font-heading font-bold text-2xl text-center mb-12"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('landing.features.title')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {FEATURES.map((f) => (
                  <article key={f} className="glass-card flex flex-col gap-3">
                    <h3
                      className="font-heading font-semibold text-base"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {t(`landing.features.${f}_title`)}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {t(`landing.features.${f}_desc`)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* ── Use Cases ── */}
          <section
            className="py-16"
            style={{ background: 'var(--bg-main)' }}
            aria-labelledby="usecases-heading"
          >
            <div className="max-w-5xl mx-auto px-4">
              <h2
                id="usecases-heading"
                className="font-heading font-bold text-2xl text-center mb-12"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('landing.usecases.title')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {USE_CASES.map(({ key, icon }) => (
                  <article
                    key={key}
                    className="glass-card flex flex-col gap-3 text-center items-center"
                  >
                    <span className="text-4xl" role="img" aria-hidden="true">{icon}</span>
                    <h3
                      className="font-heading font-semibold text-base"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {t(`landing.usecases.${key}_label`)}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {t(`landing.usecases.${key}_desc`)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section
            className="py-16"
            style={{ background: '#fff', borderTop: '1px solid var(--border-color)' }}
            aria-labelledby="faq-heading"
          >
            <div className="max-w-2xl mx-auto px-4">
              <h2
                id="faq-heading"
                className="font-heading font-bold text-2xl text-center mb-10"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('landing.faq.title')}
              </h2>
              <dl className="flex flex-col gap-4">
                {FAQ_KEYS.map((n) => (
                  <div key={n} className="glass-card">
                    <dt className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      {t(`landing.faq.q${n}`)}
                    </dt>
                    <dd className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {t(`landing.faq.a${n}`)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* ── CTA Banner ── */}
          <section
            className="py-16 text-center"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
            }}
          >
            <div className="max-w-xl mx-auto px-4">
              <h2
                className="font-heading font-bold text-2xl mb-4 text-white"
              >
                {t('landing.hero.headline')}
              </h2>
              <p className="text-white/80 mb-8 text-sm">
                {t('landing.hero.free_badge')}
              </p>
              <button
                onClick={handleLogin}
                className="btn bg-white px-8 py-3 text-base font-medium"
                style={{ color: 'var(--primary)' }}
              >
                {t('landing.hero.cta')}
              </button>
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer
          className="py-8 text-center text-sm border-t"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
        >
          <p className="font-heading font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
            Shifter
          </p>
          <p className="mb-1">{t('landing.footer.tagline')}</p>
          <p>{t('landing.footer.copyright')}</p>
        </footer>
      </div>
    </>
  );
}
