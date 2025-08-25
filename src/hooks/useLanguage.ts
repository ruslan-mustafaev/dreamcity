import { useState, useEffect } from 'react';
import { Language } from '../types';

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dreamcity-language') as Language;
      return saved || 'sk';
    }
    return 'sk';
  });

  useEffect(() => {
    localStorage.setItem('dreamcity-language', language);
  }, [language]);

  return { language, setLanguage };
};