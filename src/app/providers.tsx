'use client';

import { ApolloProvider } from '@apollo/client';
import { ThemeProvider } from 'next-themes';
import client from '@/lib/apolloClient';
import { ModalProvider } from '../contexts/ModalContext';
import ClerkAuthContext from '../contexts/ClerkAuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={client}>
      <ClerkAuthContext>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ModalProvider>
            {children}
          </ModalProvider>
        </ThemeProvider>
      </ClerkAuthContext>
    </ApolloProvider>
  );
}
