import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { translations } from '../constants/translations';
import { Language } from '../types';

interface City3DProps {
  language: Language;
  scrollY: number;
}

export const City3D: React.FC<City3DProps> = ({ language, scrollY }) => {
  const t = translations[language];

  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden backdrop-blur-md bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5">
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/logo/DreamCity_Logo_Transparent-2.png" 
              alt="DreamCity Group" 
             className="h-12 w-auto mr-3 md:h-20 md:mr-6"
            />
           <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white">
              DreamCity Group
            </h1>
          </div>
          
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
           className="text-lg sm:text-xl md:text-2xl lg:text-3xl bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent mb-6 font-semibold px-4"
          >
            {t.hero.subtitle}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
           className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed px-4 max-w-3xl mx-auto"
          >
            {t.hero.description}
          </motion.p>
          
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            onClick={scrollToContact}
           className="relative bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-all duration-500 transform hover:scale-110 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/25 overflow-hidden group mx-4"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
            <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
            <span className="relative z-10 flex items-center gap-2">
            {t.hero.cta}
            </span>
          </motion.button>
        </motion.div>
      </div>
      
    </section>
  );
};