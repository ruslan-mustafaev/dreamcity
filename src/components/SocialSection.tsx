import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Send, Facebook, Instagram } from 'lucide-react';
import { translations } from '../constants/translations';
import { SOCIAL_LINKS } from '../constants/config';
import { Language } from '../types';

interface SocialSectionProps {
  language: Language;
}

export const SocialSection: React.FC<SocialSectionProps> = ({ language }) => {
  const t = translations[language];
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const socialLinks = [
    {
      name: 'Telegram',
      url: SOCIAL_LINKS.telegram,
      icon: Send,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Быстрые ответы и консультации'
    },
    {
      name: 'Facebook',
      url: SOCIAL_LINKS.facebook,
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Новости и предложения'
    },
    {
      name: 'Instagram',
      url: SOCIAL_LINKS.instagram,
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      description: 'Фото объектов и истории успеха'
    }
  ];

  return (
    <section className="relative py-20">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          {/* Заголовок с подложкой */}
          <div className="w-full flex justify-center mb-4">
            <div className="advantage-backdrop" style={{ padding: '25px 35px' }}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold" 
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: 'none',
                    lineHeight: '1.2',
                    margin: '0',
                    whiteSpace: 'nowrap'
                  }}>
                {t.social.title}
              </h2>
            </div>
          </div>
          
          {/* Подзаголовок с отдельной подложкой */}
          <div className="w-full flex justify-center">
            <div className="advantage-backdrop" style={{ padding: '15px 25px' }}>
              <p className="text-base sm:text-lg md:text-xl font-medium text-gray-900 dark:text-white" 
                 style={{
                   lineHeight: '1.2',
                   margin: '0',
                   whiteSpace: 'nowrap'
                 }}>
                {t.social.subtitle}
              </p>
            </div>
          </div>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {socialLinks.map((social, index) => (
            <motion.a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="light-backdrop group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-4 cursor-pointer"
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 ${social.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <social.icon className="text-white" size={32} />
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-center">
                {social.name}
              </h3>
              
              <div className="text-sm sm:text-base text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline text-center">
                {t.social.subscribe}
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};
