import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Akazify Operator',
    template: '%s | Akazify Operator',
  },
  description: 'Manufacturing Execution System - Operator Interface for factory floor operations, equipment monitoring, and production management.',
  keywords: [
    'manufacturing',
    'MES',
    'operator interface',
    'factory floor',
    'production management',
    'equipment monitoring',
    'ISA-95',
    'industrial',
  ],
  authors: [
    {
      name: 'Akazify',
      url: 'https://akazify.com',
    },
  ],
  creator: 'Akazify',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://operator.akazify.com',
    title: 'Akazify Operator',
    description: 'Manufacturing Execution System - Operator Interface',
    siteName: 'Akazify Operator',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Akazify Operator Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Akazify Operator',
    description: 'Manufacturing Execution System - Operator Interface',
    images: ['/og-image.png'],
  },
  robots: {
    index: false, // Operator interface should not be indexed
    follow: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Akazify Operator',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom on factory tablets
  viewportFit: 'cover', // Handle notches on mobile devices
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="" />
        
        {/* Manufacturing-specific meta tags */}
        <meta name="application-name" content="Akazify Operator" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Akazify Operator" />
        
        {/* Prevent context menu on long press for factory tablets */}
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Disable automatic phone number detection */}
        <meta name="format-detection" content="telephone=no" />
        
        {/* Icons for PWA */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#0066cc" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#0066cc" />
        <meta name="msapplication-TileImage" content="/mstile-144x144.png" />
        
        {/* Preconnect to API and websocket endpoints */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
      </head>
      <body 
        className={`${inter.className} antialiased min-h-screen bg-background font-sans`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <Toaster 
            position="top-right"
            expand={true}
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
              className: '!bg-card !text-card-foreground !border-border',
            }}
          />
        </Providers>
        
        {/* Prevent drag and drop on factory tablets */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('dragstart', function(e) {
                e.preventDefault();
              });
              document.addEventListener('selectstart', function(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                e.preventDefault();
              });
            `,
          }}
        />
      </body>
    </html>
  )
}
