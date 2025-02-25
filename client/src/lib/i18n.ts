import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type Language = 'en' | 'sv';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  en: {
    "app.title": "Forklift Service Tracker",
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.username": "Username",
    "auth.password": "Password",
    "forklift.brand": "Brand",
    "forklift.model": "Model Type",
    "forklift.engine": "Engine Specifications",
    "forklift.transmission": "Transmission",
    "forklift.tires": "Tire Specifications",
    "forklift.mast": "Mast Information",
    "forklift.forks": "Fork Details",
    "forklift.service.hours": "Service Hours",
    "forklift.service.next": "Next Service Due",
    "forklift.filters": "Filters",
    "forklift.lubricants": "Lubricants",
    "service.500h": "500h Service",
    "service.1000h": "1000h Service",
    "service.1500h": "1500h Service",
    "service.2000h": "2000h Service",
    "service.overdue": "Overdue",
    "service.days_until": "days until service",
    "action.add": "Add Forklift",
    "action.edit": "Edit",
    "action.delete": "Delete",
    "action.save": "Save",
  },
  sv: {
    "app.title": "Truckunderhållsspårare",
    "auth.login": "Logga in",
    "auth.register": "Registrera",
    "auth.username": "Användarnamn",
    "auth.password": "Lösenord",
    "forklift.brand": "Märke",
    "forklift.model": "Modelltyp",
    "forklift.engine": "Motorspecifikationer",
    "forklift.transmission": "Transmission",
    "forklift.tires": "Däckspecifikationer",
    "forklift.mast": "Mastinformation",
    "forklift.forks": "Gaffeldetaljer",
    "forklift.service.hours": "Servicetimmar",
    "forklift.service.next": "Nästa service",
    "forklift.filters": "Filter",
    "forklift.lubricants": "Smörjmedel",
    "service.500h": "500h Service",
    "service.1000h": "1000h Service",
    "service.1500h": "1500h Service",
    "service.2000h": "2000h Service",
    "service.overdue": "Försenad",
    "service.days_until": "dagar till service",
    "action.add": "Lägg till truck",
    "action.edit": "Redigera",
    "action.delete": "Ta bort",
    "action.save": "Spara",
  }
};

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useI18n = create<I18nStore>()(
  devtools(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang: Language) => set({ language: lang }),
      t: (key: string) => translations[get().language][key] || key,
    }),
    {
      name: 'i18n-store',
    }
  )
);