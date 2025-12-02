import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { availableLanguages } from '../i18n/translations';
import './LanguageSelector.css';

export default function LanguageSelector() {
  const { language, changeLanguage } = useTranslation();

  return (
    <div className="language-selector">
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="language-select"
        title="Select language"
      >
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}

