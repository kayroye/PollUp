import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PollUp',
  description: 'Create and share polls with your friends',
  openGraph: {
    images: [
      {
        url: '/logo.png',
        width: 256,
        height: 256,
        alt: 'PollUp - Create and share polls',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/logo.png'],
  },
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
