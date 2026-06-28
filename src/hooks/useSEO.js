import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function useSEO({ titleKey, descKey } = {}) {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  useEffect(() => {
    if (titleKey) document.title = t(titleKey)
    if (descKey) {
      const meta = document.querySelector('meta[name="description"]')
      if (meta) meta.setAttribute('content', t(descKey))
    }
  }, [titleKey, descKey, t])
}
