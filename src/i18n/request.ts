import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const SUPPORTED_LOCALES = ['pt-BR', 'en-US', 'es'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const loadMessages = async (locale: SupportedLocale) => {
  switch (locale) {
    case 'en-US':
      return (await import('../../messages/en-US.json')).default;
    case 'es':
      return (await import('../../messages/es.json')).default;
    case 'pt-BR':
    default:
      return (await import('../../messages/pt-BR.json')).default;
  }
};

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = store.get('NEXT_LOCALE')?.value || 'pt-BR';
  const isSupported = SUPPORTED_LOCALES.includes(locale as SupportedLocale);
  const activeLocale = isSupported ? (locale as SupportedLocale) : 'pt-BR';

  return {
    locale: activeLocale,
    messages: await loadMessages(activeLocale),
  };
});
