import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { getTranslation, getText, DEFAULT_LANGUAGE, LANGUAGES } from '../localization';

const LanguageContext = createContext();

const LANGUAGE_STORAGE_KEY = '@dreampack_language';

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState(getTranslation(DEFAULT_LANGUAGE));
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on app start
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      
      if (savedLanguage && LANGUAGES[savedLanguage]) {
        // Kullanıcı daha önce bir dil seçmişse onu kullan
        changeLanguage(savedLanguage);
      } else {
        // Cihaz dilini algıla
        const deviceLanguage = Localization.locale.split('-')[0]; // 'en-US' -> 'en'
        
        // Desteklenen diller arasında cihaz dili varsa onu kullan
        if (LANGUAGES[deviceLanguage]) {
          changeLanguage(deviceLanguage);
        } else {
          // Desteklenmiyorsa varsayılan dili kullan
          changeLanguage(DEFAULT_LANGUAGE);
        }
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
      // Hata durumunda varsayılan dili kullan
      changeLanguage(DEFAULT_LANGUAGE);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (languageCode) => {
    try {
      if (LANGUAGES[languageCode]) {
        setCurrentLanguage(languageCode);
        setTranslations(getTranslation(languageCode));
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key) => {
    return getText(key, currentLanguage);
  };

  const value = {
    currentLanguage,
    translations,
    changeLanguage,
    t,
    isLoading,
    availableLanguages: LANGUAGES
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};