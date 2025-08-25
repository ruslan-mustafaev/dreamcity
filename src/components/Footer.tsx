import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { CONTACT_INFO } from '../constants/config';
import { translations } from '../constants/translations';
import { Language } from '../types';

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const t = translations[language];

  return (
    <footer className="relative bg-gray-900/20 backdrop-blur-sm text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-2">
                <img 
                  src="/logo/DreamCity_Logo_Transparent-2.png" 
                  alt="DreamCity Group" 
                  className="h-8 w-auto sm:h-10"
                />
              </div>
              <span className="text-lg sm:text-xl md:text-2xl font-bold">{t.footer.company}</span>
            </div>
            <p className="text-sm sm:text-base text-gray-300 mb-4">
              {t.footer.description}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-4">{t.footer.contacts}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <Phone size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="break-all">{CONTACT_INFO.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <Mail size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="break-all">{CONTACT_INFO.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <MapPin size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{t.footer.location}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-4">{t.footer.services}</h3>
            <div className="space-y-1 text-gray-300 text-sm sm:text-base">
              <div>{t.footer.servicesList.rental}</div>
              <div>{t.footer.servicesList.sales}</div>
              <div>{t.footer.servicesList.commercial}</div>
              <div>{t.footer.servicesList.investment}</div>
              <div>{t.footer.servicesList.relocation}</div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300 text-sm sm:text-base">
          <p>{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
};