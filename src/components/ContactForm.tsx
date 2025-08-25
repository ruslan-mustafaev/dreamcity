import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Send, Phone, Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { translations } from '../constants/translations';
import { CONTACT_INFO } from '../constants/config';
import { Language } from '../types';

interface ContactFormProps {
  language: Language;
}

// Типы для состояния отправки
type SubmissionStatus = 'idle' | 'sending' | 'success' | 'error';

export const ContactForm: React.FC<ContactFormProps> = ({ language }) => {
  const t = translations[language];
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [fieldErrors, setFieldErrors] = useState<{
    name: boolean;
    email: boolean;
    phone: boolean;
    message: boolean;
  }>({
    name: false,
    email: false,
    phone: false,
    message: false
  });

  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Инициализация EmailJS
  React.useEffect(() => {
    emailjs.init('8t0NCezKx7Qq2GX2c');
  }, []);

  // Валидация телефонных номеров
  const validatePhoneNumber = (phone: string) => {
    if (!phone.trim()) return { isValid: true }; // Телефон необязательный
    
    // Удаляем все пробелы, скобки, тире
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Паттерны для разных регионов
    const phonePatterns = {
      // Словакия: +421 xxx xxx xxx
      slovakia: /^(\+421|421|0)[1-9]\d{8}$/,
      
      // Чехия: +420 xxx xxx xxx  
      czech: /^(\+420|420)[1-9]\d{8}$/,
      
      // Россия: +7 xxx xxx xx xx
      russia: /^(\+7|7|8)[1-9]\d{9}$/,
      
      // Украина: +380 xx xxx xx xx
      ukraine: /^(\+380|380)[1-9]\d{8}$/,
      
      // США/Канада: +1 xxx xxx xxxx
      northAmerica: /^(\+1|1)[2-9]\d{2}[2-9]\d{2}\d{4}$/,
      
      // Германия: +49 xxx xxxxxxx
      germany: /^(\+49|49|0)[1-9]\d{10,11}$/,
      
      // Австрия: +43 xxx xxxxxxx
      austria: /^(\+43|43|0)[1-9]\d{8,12}$/,
      
      // Польша: +48 xxx xxx xxx
      poland: /^(\+48|48)[1-9]\d{8}$/,
      
      // Венгрия: +36 xx xxx xxxx
      hungary: /^(\+36|36)[1-9]\d{8}$/,
      
      // Общий паттерн для международных номеров
      international: /^\+[1-9]\d{7,14}$/
    };

    // Проверяем по всем паттернам
    for (const [region, pattern] of Object.entries(phonePatterns)) {
      if (pattern.test(cleanPhone)) {
        return { isValid: true, region };
      }
    }

    // Дополнительная проверка на минимальную и максимальную длину
    if (cleanPhone.length < 7 || cleanPhone.length > 16) {
      return { isValid: false, reason: 'invalidLength' };
    }

    // Проверка на корректность символов
    if (!/^[\+]?[\d]+$/.test(cleanPhone)) {
      return { isValid: false, reason: 'invalidCharacters' };
    }

    return { isValid: false, reason: 'invalidFormat' };
  };

  // Валидация email доменов
  const validateEmailDomain = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return { isValid: false, reason: 'noDomain' };

    // Популярные и проверенные домены
    const validDomains = [
      // Международные
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
      'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com',
      
      // Российские
      'yandex.ru', 'mail.ru', 'inbox.ru', 'list.ru', 'bk.ru', 'rambler.ru',
      
      // Словацкие и европейские
      'azet.sk', 'centrum.sk', 'atlas.sk', 'zoznam.sk', 'post.sk',
      'orange.sk', 'telekom.sk', 'chello.sk',
      
      // Чешские
      'seznam.cz', 'centrum.cz', 'post.cz', 'quick.cz',
      
      // Немецкие
      'gmx.de', 'web.de', 't-online.de', 'freenet.de',
      
      // Украинские
      'ukr.net', 'i.ua', 'bigmir.net', 'meta.ua',
      
      // Корпоративные и другие
      'yahoo.co.uk', 'yahoo.fr', 'yahoo.de', 'yahoo.ca',
      'hotmail.co.uk', 'hotmail.fr', 'hotmail.de',
      'googlemail.com', 'pm.me'
    ];

    // Паттерны для корпоративных доменов
    const corporatePatterns = [
      /^[a-zA-Z0-9-]+\.(com|net|org|edu|gov)$/,
      /^[a-zA-Z0-9-]+\.(sk|cz|de|at|hu|pl|ua|ru)$/,
      /^[a-zA-Z0-9-]+\.(co\.uk|co\.za|com\.au|com\.br)$/
    ];

    // Проверка на популярные домены
    if (validDomains.includes(domain)) {
      return { isValid: true, type: 'popular' };
    }

    // Проверка корпоративных доменов
    for (const pattern of corporatePatterns) {
      if (pattern.test(domain)) {
        // Дополнительная проверка - домен должен содержать минимум 4 символа
        const domainParts = domain.split('.');
        const mainDomain = domainParts[0];
        
        if (mainDomain.length >= 3) {
          return { isValid: true, type: 'corporate' };
        }
      }
    }

    // Подозрительные домены
    const suspiciousDomains = [
      'tempmail.', '10minutemail.', 'guerrillamail.', 'mailinator.',
      'throwaway', 'temp-mail', 'fake', 'test', 'example',
      '@ail.com', 'ail.com' // Добавляем конкретно этот домен
    ];

    for (const suspicious of suspiciousDomains) {
      if (domain.includes(suspicious)) {
        return { isValid: false, reason: 'suspicious' };
      }
    }

    // Проверка на очевидно неправильные домены
    if (domain.length < 4 || !domain.includes('.')) {
      return { isValid: false, reason: 'invalid' };
    }

    // Если домен не в списке популярных, но выглядит правдоподобно
    return { isValid: true, type: 'unknown' };
  };
  const formatPhoneNumber = (value: string) => {
    // Удаляем все кроме цифр и +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Если начинается с +421 (Словакия)
    if (cleaned.startsWith('+421')) {
      return cleaned.replace(/(\+421)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    }
    
    // Если начинается с +7 (Россия)
    if (cleaned.startsWith('+7')) {
      return cleaned.replace(/(\+7)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    
    // Если начинается с +420 (Чехия)
    if (cleaned.startsWith('+420')) {
      return cleaned.replace(/(\+420)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    }
    
    // Если начинается с +1 (США/Канада)
    if (cleaned.startsWith('+1')) {
      return cleaned.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    }
    
    // Для других международных номеров
    if (cleaned.startsWith('+')) {
      return cleaned.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d+)/, '$1 $2 $3 $4');
    }
    
    return cleaned;
  };

  // Фильтр спама и неподобающего контента
  const validateContent = (formData: typeof formData) => {
    const spamKeywords = [
      // Спам слова
      'bitcoin', 'crypto', 'loan', 'money', 'cash', 'prize', 'winner', 'congratulations',
      'free money', 'click here', 'urgent', 'limited time', 'act now', 'guarantee',
      
      // Мат и неподобающий контент (на разных языках)
      'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard',
      'блядь', 'сука', 'пизда', 'хуй', 'ебать', 'мудак', 'долбоеб',
      'kurva', 'piča', 'kokot', 'jebať', 'sráč',
      
      // Подозрительные фразы (убираем общие слова)
      'seo services', 'backlinks for', 'rank higher google', 'marketing services offer',
      'increase traffic guaranteed', 'social media followers', 'buy likes',
      
      // Фармацевтика и подозрительные товары
      'viagra', 'cialis', 'online pharmacy', 'buy pills', 'cheap medication',
    ];

    const suspiciousPatterns = [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Номера карт
      /[A-Z]{8,}/, // Много заглавных букв подряд (увеличили лимит)
      /(.)\1{6,}/, // Повторяющиеся символы (увеличили лимит)
      /\$\d+.*discount/, // Цены со скидками
      /€\d+.*sale/, // Цены с распродажей
      /\b\d+%\s*(off|discount|sale)\b/i, // Скидки
      /https?:\/\/[^\s]+\.(com|net|org|ru|sk|cz)\/[^\s]+/i, // Полные URL с путями
    ];

    const textToCheck = `${formData.name} ${formData.message} ${formData.email}`.toLowerCase();

    // Проверка на спам слова
    for (const keyword of spamKeywords) {
      if (textToCheck.includes(keyword.toLowerCase())) {
        console.log('Spam keyword detected:', keyword); // Для отладки
        return {
          isValid: false,
          reason: 'spamKeyword',
          keyword: keyword
        };
      }
    }

    // Проверка подозрительных паттернов
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(textToCheck)) {
        console.log('Suspicious pattern detected:', pattern); // Для отладки
        return {
          isValid: false,
          reason: 'suspiciousPattern'
        };
      }
    }

    // Проверка на слишком короткое сообщение
    if (formData.message.trim().length < 10) {
      return {
        isValid: false,
        reason: 'tooShort'
      };
    }

    // Проверка на слишком длинное сообщение (возможный спам)
    if (formData.message.length > 2000) {
      return {
        isValid: false,
        reason: 'tooLong'
      };
    }

    // Проверка на подозрительный email домен
    const suspiciousDomains = ['tempmail.', '10minutemail.', 'guerrillamail.', 'mailinator.'];
    const emailDomain = formData.email.split('@')[1]?.toLowerCase();
    
    if (emailDomain && suspiciousDomains.some(domain => emailDomain.includes(domain))) {
      return {
        isValid: false,
        reason: 'suspiciousEmail'
      };
    }

    return { isValid: true };
  };

  const showNotification = (messageKey: string, type: 'success' | 'error') => {
    const messages = {
      ru: {
        fillRequired: 'Пожалуйста, заполните все обязательные поля',
        invalidEmail: 'Пожалуйста, введите корректный email адрес',
        invalidEmailDomain: 'Пожалуйста, используйте действующий email адрес',
        invalidPhone: 'Пожалуйста, введите корректный номер телефона',
        success: 'Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.',
        error: 'Произошла ошибка при отправке сообщения. Попробуйте еще раз.',
        spamDetected: 'Ваше сообщение содержит недопустимый контент. Пожалуйста, измените текст.',
        messageTooShort: 'Сообщение слишком короткое. Напишите более подробно.',
        messageTooLong: 'Сообщение слишком длинное. Сократите текст.',
        suspiciousContent: 'Недопустимая форма сообщения. Проверьте введенный текст.'
      },
      sk: {
        fillRequired: 'Prosím, vyplňte všetky povinné polia',
        invalidEmail: 'Prosím, zadajte správnu emailovú adresu',
        invalidEmailDomain: 'Prosím, použite funkčnú emailovú adresu',
        invalidPhone: 'Prosím, zadajte správne telefónne číslo',
        success: 'Správa bola úspešne odoslaná! Skontaktujeme sa s vami čoskoro.',
        error: 'Nastala chyba pri odosielaní správy. Skúste to znova.',
        spamDetected: 'Vaša správa obsahuje neprijateľný obsah. Prosím, zmeňte text.',
        messageTooShort: 'Správa je príliš krátka. Napíšte podrobnejšie.',
        messageTooLong: 'Správa je príliš dlhá. Skráťte text.',
        suspiciousContent: 'Neprípustná forma správy. Skontrolujte zadaný text.'
      },
      en: {
        fillRequired: 'Please fill in all required fields',
        invalidEmail: 'Please enter a valid email address',
        invalidEmailDomain: 'Please use a working email address',
        invalidPhone: 'Please enter a valid phone number',
        success: 'Message sent successfully! We will contact you soon.',
        error: 'An error occurred while sending the message. Please try again.',
        spamDetected: 'Your message contains inappropriate content. Please modify your text.',
        messageTooShort: 'Message is too short. Please write in more detail.',
        messageTooLong: 'Message is too long. Please shorten the text.',
        suspiciousContent: 'Invalid message format. Please check the entered text.'
      }
    };
    
    const message = messages[language][messageKey] || messages['en'][messageKey];
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    // Сброс ошибок
    setFieldErrors({
      name: false,
      email: false,
      phone: false,
      message: false
    });

    // Валидация формы с указанием конкретных полей
    const errors = {
      name: !formData.name.trim(),
      email: !formData.email.trim(),
      phone: false,
      message: !formData.message.trim()
    };

    // Проверка email формата
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email.trim() && !emailRegex.test(formData.email)) {
      errors.email = true;
    }

    // Проверка домена email
    if (formData.email.trim() && emailRegex.test(formData.email)) {
      const domainValidation = validateEmailDomain(formData.email);
      if (!domainValidation.isValid) {
        errors.email = true;
      }
    }

    // Проверка телефона (если указан)
    if (formData.phone.trim()) {
      const phoneValidation = validatePhoneNumber(formData.phone);
      if (!phoneValidation.isValid) {
        errors.phone = true;
      }
    }

    // Если есть ошибки в основных полях
    if (errors.name || errors.email || errors.phone || errors.message) {
      setFieldErrors(errors);
      
      if (errors.name || errors.email || errors.message) {
        showNotification('fillRequired', 'error');
      } else if (errors.phone) {
        showNotification('invalidPhone', 'error');
      }
      
      setStatus('idle');
      return;
    }

    // Дополнительная проверка email домена для более конкретного сообщения
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showNotification('invalidEmail', 'error');
        setStatus('idle');
        return;
      }
      
      const domainValidation = validateEmailDomain(formData.email);
      if (!domainValidation.isValid) {
        showNotification('invalidEmailDomain', 'error');
        setStatus('idle');
        return;
      }
    }

    // Проверка контента на спам и неподобающий контент
    const contentValidation = validateContent(formData);
    if (!contentValidation.isValid) {
      let messageKey = 'spamDetected';
      
      switch (contentValidation.reason) {
        case 'tooShort':
          messageKey = 'messageTooShort';
          break;
        case 'tooLong':
          messageKey = 'messageTooLong';
          break;
        case 'suspiciousPattern':
        case 'suspiciousEmail':
          messageKey = 'suspiciousContent';
          break;
        default:
          messageKey = 'spamDetected';
      }
      
      showNotification(messageKey, 'error');
      setStatus('idle');
      return;
    }

    try {
      // Параметры для шаблона EmailJS
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        phone: formData.phone || 'Не указан',
        message: formData.message,
        sent_date: new Date().toLocaleString('ru-RU'),
        to_email: 'dreamcity.dcg@gmail.com'
      };

      // Отправка через EmailJS
      const response = await emailjs.send(
        'service_6dawfcq',
        'template_idqyli6',
        templateParams
      );

      console.log('Email sent successfully:', response);
      
      setStatus('success');
      showNotification('success', 'success');
      
      // Очистка формы и ошибок
      setFormData({ name: '', email: '', phone: '', message: '' });
      setFieldErrors({
        name: false,
        email: false,
        phone: false,
        message: false
      });
      
    } catch (error) {
      console.error('Error sending email:', error);
      setStatus('error');
      showNotification('error', 'error');
    } finally {
      // Сброс статуса через 3 секунды
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Специальная обработка для телефона - форматирование в реальном времени
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setFormData({
        ...formData,
        [name]: formattedPhone
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Компонент уведомления
  const Notification = () => {
    if (!notification.show) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          {notification.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      </motion.div>
    );
  };

  return (
    <section id="contact" className="relative py-20">
      <Notification />
      
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 pb-4"
        >
          {/* ИЗМЕНЕНИЕ: Добавлена такая же подложка как у других заголовков */}
          <div className="advantage-backdrop inline-block" style={{ padding: '20px 30px' }}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold" 
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                  lineHeight: '1.2',
                  margin: '0'
                }}>
              {t.contact.title}
            </h2>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-xl p-6 sm:p-8 shadow-lg"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-1">
                  {t.contact.form.name}{fieldErrors.name && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={status === 'sending'}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                    fieldErrors.name 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={language === 'ru' ? 'Введите ваше имя' : language === 'sk' ? 'Zadajte vaše meno' : 'Enter your name'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-1">
                  {t.contact.form.email}{fieldErrors.email && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={status === 'sending'}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                    fieldErrors.email 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={language === 'ru' ? 'example@email.com' : language === 'sk' ? 'priklad@email.com' : 'example@email.com'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-1">
                  {t.contact.form.phone}{fieldErrors.phone && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={status === 'sending'}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                    fieldErrors.phone 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={language === 'ru' ? '+7 (999) 123-45-67' : language === 'sk' ? '+421 999 123 456' : '+1 (555) 123-4567'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-1">
                  {t.contact.form.message}{fieldErrors.message && <span className="text-red-500 ml-1">*</span>}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  required
                  disabled={status === 'sending'}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                    fieldErrors.message 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={language === 'ru' ? 'Расскажите, чем мы можем помочь...' : language === 'sk' ? 'Povedzte nám, ako vám môžeme pomôcť...' : 'Tell us how we can help you...'}
                />
              </div>
              
              <button
                type="submit"
                disabled={status === 'sending'}
                className={`w-full py-2.5 px-4 sm:py-3 sm:px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 transform shadow-lg text-sm sm:text-base ${
                  status === 'sending'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : status === 'success'
                    ? 'bg-green-500 hover:bg-green-600'
                    : status === 'error'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 hover:scale-105 hover:shadow-xl'
                } text-white`}
              >
                {status === 'sending' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {language === 'ru' ? 'Отправляется...' : language === 'sk' ? 'Odosielam...' : 'Sending...'}
                  </>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle size={16} className="sm:w-5 sm:h-5" />
                    {language === 'ru' ? 'Отправлено!' : language === 'sk' ? 'Odoslané!' : 'Sent!'}
                  </>
                ) : status === 'error' ? (
                  <>
                    <AlertCircle size={16} className="sm:w-5 sm:h-5" />
                    {language === 'ru' ? 'Попробовать снова' : language === 'sk' ? 'Skúsiť znova' : 'Try again'}
                  </>
                ) : (
                  <>
                    <Send size={16} className="sm:w-5 sm:h-5" />
                    {t.contact.form.submit}
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-8"
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 sm:p-8 shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {t.contact.info.title}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="text-purple-600 dark:text-purple-400" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Телефон</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{CONTACT_INFO.phone}</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">+421 947 17 11 14</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-100 to-purple-100 dark:from-cyan-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="text-purple-600 dark:text-purple-400" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Email</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm break-all">{CONTACT_INFO.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-100 to-purple-100 dark:from-cyan-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="text-cyan-600 dark:text-cyan-400" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{t.contact.info.workingHours}</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{CONTACT_INFO.workingHours}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};