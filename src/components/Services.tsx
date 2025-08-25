import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Home, Building, TrendingUp, MapPin } from 'lucide-react';
import { translations } from '../constants/translations';
import { Language } from '../types';

interface ServicesProps {
  language: Language;
}

export const Services: React.FC<ServicesProps> = ({ language }) => {
  const t = translations[language];
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const services = [
    {
      icon: Home,
      title: t.services.residential.title,
      items: t.services.residential.items,
      color: 'emerald'
    },
    {
      icon: Building,
      title: t.services.commercial.title,
      items: t.services.commercial.items,
      color: 'teal'
    },
    {
      icon: TrendingUp,
      title: t.services.investment.title,
      items: t.services.investment.items,
      color: 'blue'
    },
    {
      icon: MapPin,
      title: t.services.relocation.title,
      items: t.services.relocation.items,
      color: 'cyan'
    }
  ];

  const colorClasses = {
    emerald: 'bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 text-cyan-600 dark:text-cyan-400',
    teal: 'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400',
    blue: 'bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 text-blue-600 dark:text-blue-400',
    cyan: 'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-purple-600 dark:text-purple-400'
  };

  return (
    <section id="services" className="relative py-20">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          {/* Подложка */}
          <div className="advantage-backdrop inline-block px-9 py-6">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-snug" 
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                margin: 0,
                paddingBottom: '4px' // дополнительный отступ снизу
              }}
            >
              {t.services.title}
            </h2>
          </div>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="advantage-backdrop transform hover:-translate-y-2"
            >
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg ${colorClasses[service.color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}
              >
                <service.icon size={24} className="sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
                {service.title}
              </h3>
              <ul className="space-y-2">
                {service.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-sm text-gray-600 dark:text-gray-300">
                    • {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
