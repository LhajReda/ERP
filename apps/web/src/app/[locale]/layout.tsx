import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { rtlLocales, type Locale } from '@/i18n/config';
import { Providers } from '@/lib/providers';
import { cn } from '@/lib/utils';
import '../globals.css';

export const metadata: Metadata = {
  title: 'FLA7A ERP - ERP Agricole Marocain',
  description: 'Systeme ERP agricole 100% marocain avec agents IA',
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  const dir = rtlLocales.includes(locale as Locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          dir === 'rtl' && 'font-arabic',
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
