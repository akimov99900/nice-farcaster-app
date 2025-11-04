import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://nice-miniapp.vercel.app'),
  title: 'nice - Daily Positive Wishes',
  description: 'A daily dose of positive wishes and inspiration',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'nice - Daily Positive Wishes',
    description: 'A daily dose of positive wishes and inspiration',
    images: ['/icon.svg'],
  },
  twitter: {
    card: 'summary',
    title: 'nice - Daily Positive Wishes',
    description: 'A daily dose of positive wishes and inspiration',
    images: ['/icon.svg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#FFD700" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-orange-50">
          {children}
        </div>
      </body>
    </html>
  )
}