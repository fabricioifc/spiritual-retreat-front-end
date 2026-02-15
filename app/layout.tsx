import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { Poppins } from 'next/font/google';

// import { getLocale } from "next-intl/server";
import { InitColorSchemeScript } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

import { auth } from '@/auth';
import { ModalProvider } from '@/src/contexts/ModalContext';
import EmotionCacheProvider from '@/src/providers/EmotionCacheProvider';
import QueryClientProviderWrapper from '@/src/providers/QueryClientProvider';
import SnackbarClientProvider from '@/src/providers/SnackbarProvider';
import ThemeMuiProvider from '@/src/providers/ThemeMuiProvider';

// import { initMocks } from "@/src/mocks";
// import { MSWProvider } from "@/src/providers/MSWProvider";

// if (process.env.NODE_ENV === "development") {
//   if (typeof window !== "undefined") {
//     initMocks();
//   }
// }

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // You can pick any weights you use
  style: ['normal', 'italic'], // Optional
  display: 'swap', // Recommended to avoid FOIT
});

export async function metadata(): Promise<Metadata> {
  return {
    title: 'SAM Gestor',
    description: 'Plataforma de gestão de retiros espirituais',
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  //const locale = getLocale();
  const session = await auth();
  const locale = await getLocale();
  const realLocale = 'pt-BR'; // Fallback para 'pt-br' se locale não for fornecido

  return (
    <html lang={locale ?? realLocale} suppressHydrationWarning>
      <body className={poppins.className}>
        <QueryClientProviderWrapper>
          <SessionProvider session={session}>
            <SnackbarClientProvider>
              <EmotionCacheProvider>
                <InitColorSchemeScript attribute="class" />
                <AppRouterCacheProvider options={{ enableCssLayer: true }}>
                  <ThemeMuiProvider>
                    {/* <NextIntlClientProvider locale={locale ?? realLocale}> */}
                    <NextIntlClientProvider>
                      {/* <MSWProvider> */}
                      <ModalProvider>{children}</ModalProvider>
                      {/* <ToastContainer /> */}
                      {/* </MSWProvider> */}
                    </NextIntlClientProvider>
                  </ThemeMuiProvider>
                </AppRouterCacheProvider>
              </EmotionCacheProvider>
            </SnackbarClientProvider>
          </SessionProvider>
        </QueryClientProviderWrapper>
      </body>
    </html>
  );
}
