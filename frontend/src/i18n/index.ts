import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import sv from './sv'

i18n.use(initReactI18next).init({
  resources: { sv: { translation: sv } },
  lng: 'sv',
  interpolation: { escapeValue: false },
})

export default i18n
