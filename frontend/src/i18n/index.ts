import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import sv from './sv'
import en from './en'
import fa from './fa'
import lv from './lv'
import pl from './pl'

i18n.use(initReactI18next).init({
  resources: {
    sv: { translation: sv },
    en: { translation: en },
    fa: { translation: fa },
    lv: { translation: lv },
    pl: { translation: pl },
  },
  lng: 'sv',
  fallbackLng: 'sv',
  interpolation: { escapeValue: false },
})

export default i18n
