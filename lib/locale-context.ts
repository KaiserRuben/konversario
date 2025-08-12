import { headers } from 'next/headers';

export async function getLocaleFromHeaders(): Promise<string> {
  try {
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');
    
    if (acceptLanguage) {
      const languages = acceptLanguage.split(',').map(lang => lang.split(';')[0].toLowerCase());
      const supportedLocales = ['en', 'de', 'fr'];
      
      for (const lang of languages) {
        if (supportedLocales.includes(lang)) {
          return lang;
        }
        // Check for language variants (e.g., 'de-DE' -> 'de')
        const langCode = lang.split('-')[0];
        if (supportedLocales.includes(langCode)) {
          return langCode;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to detect locale from headers:', error);
  }
  
  return 'en'; // fallback to English
}