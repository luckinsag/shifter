import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'ja',    label: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { code: 'en',    label: 'English', flag: '🇬🇧' },
];

export default function LangSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors"
        style={{
          background: open ? 'var(--secondary)' : 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg
          className="w-3.5 h-3.5 opacity-50 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-1 w-36 rounded-lg overflow-hidden z-50"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          {LANGUAGES.map(lang => (
            <li
              key={lang.code}
              role="option"
              aria-selected={lang.code === i18n.language}
              onClick={() => select(lang.code)}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors"
              style={{
                background: lang.code === i18n.language ? 'var(--secondary)' : 'transparent',
                color: lang.code === i18n.language ? 'var(--primary)' : 'var(--text-primary)',
                fontWeight: lang.code === i18n.language ? 500 : 400,
              }}
              onMouseEnter={e => {
                if (lang.code !== i18n.language) e.currentTarget.style.background = 'var(--bg-card-hover)';
              }}
              onMouseLeave={e => {
                if (lang.code !== i18n.language) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
