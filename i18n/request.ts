import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

export default getRequestConfig(async () => {
  // Get the locale from the URL pathname or headers
  let locale = 'en'; // default fallback

  try {
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');
    
    // Simple language detection - you can make this more sophisticated
    if (acceptLanguage) {
      const languages = acceptLanguage.split(',').map(lang => lang.split(';')[0].toLowerCase());
      const supportedLocales = ['en', 'de', 'fr'];
      
      for (const lang of languages) {
        if (supportedLocales.includes(lang)) {
          locale = lang;
          break;
        }
        // Check for language variants (e.g., 'de-DE' -> 'de')
        const langCode = lang.split('-')[0];
        if (supportedLocales.includes(langCode)) {
          locale = langCode;
          break;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to detect locale from headers, using default:', error);
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});