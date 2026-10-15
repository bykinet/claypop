// src/shared/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './en';
import { ko } from './ko';
import { ja } from './ja';

export type SupportedLocale = 'en' | 'ko' | 'ja';

// localStorage 'locale' 키에서 로드, 없으면 ko 기본 (영어가 폴백, 한국어가 원문)
const savedLocale = (localStorage.getItem('locale') as SupportedLocale) || 'ko';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
    ja: { translation: ja },
  },
  lng: savedLocale,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

/**
 * 언어 토글: EN → KO → JA → EN
 */
export function toggleLocale(): SupportedLocale {
  const current = (i18n.language as SupportedLocale) || 'en';
  let next: SupportedLocale = 'en';

  if (current === 'en') next = 'ko';
  else if (current === 'ko') next = 'ja';
  else next = 'en';

  i18n.changeLanguage(next);
  localStorage.setItem('locale', next);
  return next;
}

export default i18n;
