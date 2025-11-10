import { useState, useEffect } from 'react';
import { translations, type Language, type TranslationKey, detectLanguage } from '@/lib/translations';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const detectedLang = detectLanguage();
    setLanguage(detectedLang);
  }, []);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key];
  };

  return { language, t };
}
