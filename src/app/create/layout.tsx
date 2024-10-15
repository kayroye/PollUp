'use client';

import { ApolloProvider } from '@apollo/client';
import { AuthProvider } from '@/contexts/AuthContext';
import client from '@/lib/apolloClient';

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <section>
          {children}
        </section>
      </AuthProvider>
    </ApolloProvider>
  )
}
