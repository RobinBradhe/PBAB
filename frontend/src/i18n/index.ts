import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import sv from './sv'
import en from './en'
import fa from './fa'
import lv from './lv'
import pl from './pl'

const savedLang = localStorage.getItem('lang') ?? 'sv'

i18n.use(initReactI18next).init({
  resources: {
    sv: { translation: sv },
    en: { translation: en },
    fa: { translation: fa },
    lv: { translation: lv },
    pl: { translation: pl },
  },
  lng: savedLang,
  fallbackLng: 'sv',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', lang => localStorage.setItem('lang', lang))

export default i18n
