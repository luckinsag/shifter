import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-main)' }}>
      <div className="glass-card text-center p-12 max-w-md w-full animate-slide-up">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: '#fef3c7' }}
        >
          <svg className="w-8 h-8" style={{ color: 'var(--warning)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          {t('auth.unauthorized_title')}
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          {t('auth.unauthorized')}
        </p>
        <Link to="/" className="btn btn-primary px-8">
          {t('auth.backToHome')}
        </Link>
      </div>
    </div>
  );
}
