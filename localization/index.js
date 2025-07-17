import { en } from './en';
import { tr } from './tr';
import { id } from './id';
import { ja } from './ja';
import { th } from './th';
import { ms } from './ms';
import { LANGUAGES, DEFAULT_LANGUAGE } from './languages';

// All translations
export const translations = {
  en,
  tr,
  id,
  ja,
  th,
  ms
};

export { LANGUAGES, DEFAULT_LANGUAGE };

// Get translation function
export const getTranslation = (language = DEFAULT_LANGUAGE) => {
  return translations[language] || translations[DEFAULT_LANGUAGE];
};

// Get specific text with fallback
export const getText = (key, language = DEFAULT_LANGUAGE) => {
  const translation = getTranslation(language);
  
  // Support nested keys like 'categories.nightmare'
  const keys = key.split('.');
  let result = translation;
  
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      // Fallback to default language
      const defaultTranslation = getTranslation(DEFAULT_LANGUAGE);
      let fallbackResult = defaultTranslation;
      
      for (const fk of keys) {
        if (fallbackResult && typeof fallbackResult === 'object' && fk in fallbackResult) {
          fallbackResult = fallbackResult[fk];
        } else {
          return key; // Return key if not found
        }
      }
      
      return fallbackResult;
    }
  }
  
  return result || key;
};