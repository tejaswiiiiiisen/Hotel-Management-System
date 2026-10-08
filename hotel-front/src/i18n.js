import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslations from "./locales/en.json";
import hiTranslations from "./locales/hi.json";
import esTranslations from "./locales/es.json";
import frTranslations from "./locales/fr.json";

const resources = {
  en: { translation: enTranslations },
  hi: { translation: hiTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "hi", "es", "fr"],
    interpolation: {
      escapeValue: false, // React already safeguards against XSS
    },
    detection: {
      order: ["localStorage", "cookie", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
