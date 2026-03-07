import React, { useEffect } from 'react';

const LANGUAGES = [
  { code: 'darija', label: 'دارجة' },
  { code: 'arabic', label: 'العربية' },
  { code: 'fr', label: 'FR' },
];

function AccessibilityBar({
  fontSize,
  setFontSize,
  highContrast,
  setHighContrast,
  language,
  setLanguage,
}) {
  // Charger les préférences sauvegardées au montage
  useEffect(() => {
    const savedSize = localStorage.getItem('khidmati_fontSize');
    const savedContrast = localStorage.getItem('khidmati_contrast');
    const savedLang = localStorage.getItem('khidmati_language');
    if (savedSize) setFontSize(Number(savedSize));
    if (savedContrast) setHighContrast(savedContrast === 'true');
    if (savedLang) setLanguage(savedLang);
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

  return (
    <div
      className="flex items-center justify-between px-3 py-2 flex-wrap gap-2"
      style={{ backgroundColor: highContrast ? '#000' : '#0A6E5C' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-1 text-white font-bold">
        <span className="text-xl">🤖</span>
        <span style={{ fontSize }}>خدمتي</span>
      </div>

      {/* Boutons langue */}
      <div className="flex gap-1">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguage(lang.code)}
            className={`px-2 py-1 rounded text-sm font-medium min-w-10 ${
              language === lang.code
                ? 'bg-white text-green-800'
                : 'bg-transparent text-white border border-white opacity-70 hover:opacity-100'
            }`}
            style={{ minHeight: 36 }}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Contrôles accessibilité */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleFontSize(-2)}
          className="w-8 h-8 rounded bg-white bg-opacity-20 text-white hover:bg-opacity-40 font-bold"
          aria-label="Réduire la taille du texte"
          title="A-"
        >
          A-
        </button>
        <button
          onClick={() => handleFontSize(2)}
          className="w-8 h-8 rounded bg-white bg-opacity-20 text-white hover:bg-opacity-40 font-bold"
          aria-label="Augmenter la taille du texte"
          title="A+"
        >
          A+
        </button>
        <button
          onClick={handleContrast}
          className="w-8 h-8 rounded bg-white bg-opacity-20 text-white hover:bg-opacity-40"
          aria-label={highContrast ? 'Mode normal' : 'Contraste élevé'}
          title={highContrast ? '☀️ Normal' : '🌙 Contraste'}
        >
          {highContrast ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  );
}

export default AccessibilityBar;
