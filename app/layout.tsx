import './globals.css'
import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bearbrick-miniapp.vercel.app'),
  title: 'BearBrick — Personalized NFT Preview',
  description: 'Authenticate with Farcaster to unveil your customized BearBrick companion.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'BearBrick — Personalized NFT Preview',
    description: 'Preview your BearBrick NFT styled by your Farcaster identity.',
    images: ['/icon.svg'],
  },
  twitter: {
    card: 'summary',
    title: 'BearBrick — Personalized NFT Preview',
    description: 'Preview your BearBrick NFT styled by your Farcaster identity.',
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
        <meta name="theme-color" content="#1b133f" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" />
      </head>
      <body className={`${spaceGrotesk.className} bearbrick-body`}>
        {children}
      </body>
    </html>
  )
}
