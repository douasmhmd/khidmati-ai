import React, { useEffect } from 'react';

const LANGUAGES = [
  { code: 'darija',    label: 'دارجة' },
  { code: 'arabic',   label: 'العربية' },
  { code: 'fr',       label: 'FR' },
  { code: 'tamazight', label: 'ⵜⵎⵣ' },
];

/* Moroccan star SVG logo */
function MoroccanStarLogo() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Gold circle */}
      <circle cx="18" cy="18" r="17" fill="#C8A951" stroke="#E8D08A" strokeWidth="1" />
      {/* White inner circle */}
      <circle cx="18" cy="18" r="13" fill="white" />
      {/* Green 5-pointed star */}
      <polygon
        points="18,5 20.9,13.1 29.5,13.1 22.8,18.3 25.3,26.5 18,21.5 10.7,26.5 13.2,18.3 6.5,13.1 15.1,13.1"
        fill="#006233"
      />
    </svg>
  );
}

function AccessibilityBar({
  fontSize,
  setFontSize,
  highContrast,
  setHighContrast,
  language,
  setLanguage,
}) {
  /* Load saved preferences on mount */
  useEffect(() => {
    const savedSize    = localStorage.getItem('khidmati_fontSize');
    const savedContrast = localStorage.getItem('khidmati_contrast');
    const savedLang    = localStorage.getItem('khidmati_language');
    if (savedSize)    setFontSize(Number(savedSize));
    if (savedContrast) setHighContrast(savedContrast === 'true');
    if (savedLang)    setLanguage(savedLang);
  }, [setFontSize, setHighContrast, setLanguage]);

  const handleFontSize = (delta) => {
    const newSize = Math.min(28, Math.max(14, fontSize + delta));
    setFontSize(newSize);
    localStorage.setItem('khidmati_fontSize', newSize);
  };

  const handleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    localStorage.setItem('khidmati_contrast', next);
  };

  const handleLanguage = (code) => {
    setLanguage(code);
    localStorage.setItem('khidmati_language', code);
  };

  const headerStyle = highContrast
    ? { background: '#000', borderBottom: '2px solid #C8A951' }
    : {
        background: 'linear-gradient(135deg, #006233 0%, #004D2B 100%)',
        borderBottom: '2px solid #C8A951',
      };

  const langActiveStyle  = { backgroundColor: '#C8A951', color: '#004D2B', fontWeight: 700 };
  const langDefaultStyle = { backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)' };

  return (
    <header style={headerStyle}>
      {/* Main bar */}
      <div className="flex items-center justify-between px-3 py-2 flex-wrap gap-2">

        {/* Logo + name */}
        <div className="flex items-center gap-2">
          <MoroccanStarLogo />
          <div className="flex flex-col leading-tight">
            <span className="text-white font-bold" style={{ fontSize: Math.max(fontSize, 18), fontFamily: '"Noto Sans Arabic", sans-serif' }}>
              خدمتي AI
            </span>
            <span className="font-tifinagh text-xs" style={{ color: '#C8A951', fontFamily: '"Noto Sans Tifinagh", sans-serif' }}>
              ⵅⴷⵎⵜⵉ
            </span>
          </div>
        </div>

        {/* Language buttons */}
        <div className="flex gap-1 flex-wrap">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguage(lang.code)}
              className="px-2 py-1 rounded text-sm transition-all duration-200"
              style={{
                ...(language === lang.code ? langActiveStyle : langDefaultStyle),
                minHeight: 34,
                minWidth: 38,
                fontFamily: lang.code === 'tamazight' ? '"Noto Sans Tifinagh", sans-serif' : 'inherit',
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Accessibility controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleFontSize(-2)}
            className="w-8 h-8 rounded text-white font-bold transition-all duration-200"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)')}
            aria-label="Réduire la taille du texte"
            title="A-"
          >
            A-
          </button>
          <button
            onClick={() => handleFontSize(2)}
            className="w-8 h-8 rounded text-white font-bold transition-all duration-200"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)')}
            aria-label="Augmenter la taille du texte"
            title="A+"
          >
            A+
          </button>
          <button
            onClick={handleContrast}
            className="w-8 h-8 rounded text-white transition-all duration-200"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)')}
            aria-label={highContrast ? 'Mode normal' : 'Contraste élevé'}
            title={highContrast ? '☀️ Normal' : '🌙 Contraste'}
          >
            {highContrast ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Sub-title strip */}
      {!highContrast && (
        <div
          className="text-center py-0.5 text-xs"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.75)' }}
        >
          <span>المملكة المغربية</span>
          <span className="mx-2">•</span>
          <span className="font-tifinagh" style={{ fontFamily: '"Noto Sans Tifinagh", sans-serif' }}>
            ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ
          </span>
        </div>
      )}
    </header>
  );
}

export default AccessibilityBar;
