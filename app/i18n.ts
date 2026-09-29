import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import fr from '../locales/fr.json';

const LANGUAGE_KEY = 'app_language';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
      } else {
        callback('en');
      }
    } catch (error) {
      console.log('Error reading language', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
