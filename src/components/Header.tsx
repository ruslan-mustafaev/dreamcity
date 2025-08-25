import React, { useState, useEffect } from 'react';
import { Moon, Sun, Globe } from 'lucide-react';
import { Language, Theme } from '../types';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  setLanguage,
  theme,
  toggleTheme
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const languages: { code: Language; label: string }[] = [
    { code: 'ru', label: 'RU' },
    { code: 'sk', label: 'SK' },
    { code: 'en', label: 'EN' }
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="container mx-auto px-4 py-1 flex justify-between items-center">
        <div className="flex items-center">
          <img 
            src="/logo/DreamCity_Logo_Transparent-2.png" 
            alt="DreamCity Group" 
            className="h-10 w-auto sm:h-12 md:h-14"
          />
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-lg p-1 border border-white/20 dark:border-white/10">
            {languages.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                className={`px-2 py-1 sm:px-3 rounded text-xs sm:text-sm font-medium transition-colors ${
                  language === code
                    ? 'bg-gradient-to-r from-cyan-600/80 to-purple-600/80 text-white backdrop-blur-sm'
                    : 'text-white/90 dark:text-white/90 hover:text-purple-400 hover:bg-white/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 text-white/90 hover:text-purple-400 hover:bg-white/20 transition-all duration-300"
          >
            {theme === 'light' ? <Moon size={16} className="sm:w-5 sm:h-5" /> : <Sun size={16} className="sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};