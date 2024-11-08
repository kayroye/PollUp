import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { ClerkProvider } from '@clerk/nextjs'

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
      <html lang="en" className="dark:bg-black">
        <body className={`${inter.className} dark:bg-black`}>
          <Providers>
              {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
