import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { ClerkProvider } from '@clerk/nextjs'
import ClerkAuthContext from '../contexts/ClerkAuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PollUp',
  description: 'Create and share polls with your friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Providers>
            <ClerkAuthContext>
              {children}
            </ClerkAuthContext>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
