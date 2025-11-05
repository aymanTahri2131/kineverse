import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-700 hover:bg-primary-800 text-white transition-colors duration-200"
      aria-label="Toggle language"
    >
      <Globe size={20} />
      <span className="font-medium">{i18n.language === 'fr' ? 'عربي' : 'FR'}</span>
    </button>
  );
};

export default LanguageSwitcher;
