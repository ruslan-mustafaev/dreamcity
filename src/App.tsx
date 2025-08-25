import React, { useEffect, useState } from 'react';
import { ThreeCity } from './components/ThreeCity';
import { Header } from './components/Header';
import { City3D } from './components/City3D';
import { Services } from './components/Services';
import { Advantages } from './components/Advantages';
import { ContactForm } from './components/ContactForm';
import { SocialSection } from './components/SocialSection';
import { Footer } from './components/Footer';
import { useTheme } from './hooks/useTheme';
import { useLanguage } from './hooks/useLanguage';
import './styles/brand-backdrop.css';

function App() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <ThreeCity scrollY={scrollY} theme={theme} />
      
      <Header
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      <City3D language={language} scrollY={scrollY} />
      <Services language={language} />
      <Advantages language={language} />
      <ContactForm language={language} />
      <SocialSection language={language} />
      <Footer language={language} />
    </div>
  );
}

export default App;