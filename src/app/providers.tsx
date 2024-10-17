'use client';

import { ApolloProvider } from '@apollo/client';
import client from '../lib/apolloClient'; // Adjust the path as necessary
import { ModalProvider } from '../contexts/ModalContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}><ModalProvider>{children}</ModalProvider></ApolloProvider>;
}
