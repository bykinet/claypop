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
 * 언어 토글 순서: 한국어(ko) -> 영어(en) -> 일본어(ja) -> 한국어(ko)
 */
export function toggleLocale(): SupportedLocale {
  const current = (i18n.language || 'ko').toLowerCase();
  let next: SupportedLocale = 'ko';

  if (current.startsWith('ko')) {
    next = 'en';
  } else if (current.startsWith('en')) {
    next = 'ja';
  } else {
    next = 'ko';
  }

  i18n.changeLanguage(next);
  localStorage.setItem('locale', next);
  return next;
}

export function getCurrentLocaleLabel(lang?: string): string {
  const current = (lang || i18n.language || 'ko').toLowerCase();
  if (current.startsWith('ko')) return 'KO (한국어)';
  if (current.startsWith('en')) return 'EN (English)';
  if (current.startsWith('ja')) return 'JA (日本語)';
  return 'KO (한국어)';
}

export default i18n;
