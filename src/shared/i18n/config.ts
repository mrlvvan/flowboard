import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enBoards from "./locales/en/boards.json";
import enCards from "./locales/en/cards.json";
import enShortcuts from "./locales/en/shortcuts.json";
import ruCommon from "./locales/ru/common.json";
import ruAuth from "./locales/ru/auth.json";
import ruBoards from "./locales/ru/boards.json";
import ruCards from "./locales/ru/cards.json";
import ruShortcuts from "./locales/ru/shortcuts.json";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        boards: enBoards,
        cards: enCards,
        shortcuts: enShortcuts,
      },
      ru: {
        common: ruCommon,
        auth: ruAuth,
        boards: ruBoards,
        cards: ruCards,
        shortcuts: ruShortcuts,
      },
    },
    defaultNS: "common",
    fallbackLng: "en",
    supportedLngs: ["en", "ru"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
