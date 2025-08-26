import type { Metadata } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import "./globals.css"

import Providers from "@/components/providers"
import ErrorBoundary from "@/components/ErrorBoundary"
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics"

const inter = Inter({
  display: "swap",
  variable: "--font-inter",
  subsets: ["latin"],
  preload: true,
})

const spaceGrotesk = Space_Grotesk({
  display: "swap",
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  preload: false,
})

export const metadata: Metadata = {
  title: "Provn - Own Your Content, Own Your Future",
  description: "First short-form video platform with on-chain IP protection on Camp Network",
  generator: "Next.js",
  metadataBase: new URL('https://provn-new-wizz-camp.vercel.app'),
  openGraph: {
    title: "Provn - Decentralized Content Platform",
    description: "First short-form video platform with on-chain IP protection on Camp Network",
    type: "website",
    locale: "en_US",
    url: "https://provn-new-wizz-camp.vercel.app",
    siteName: "Provn",
    images: [
      {
        url: "/og-image.png", // We'll need to create this
        width: 1200,
        height: 630,
        alt: "Provn - Decentralized Content Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Provn - Decentralized Content Platform",
    description: "First short-form video platform with on-chain IP protection on Camp Network",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} dark`}>
      <head>
        <style>{`
          html {
            font-family: ${inter.style.fontFamily};
            --font-inter: ${inter.variable};
            --font-headline: ${spaceGrotesk.style.fontFamily};
          }
        `}</style>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Handle browser extension conflicts gracefully
            window.addEventListener('error', function(e) {
              if (e.message && (e.message.includes('Cannot redefine property: ethereum') || e.message.includes('ethereum'))) {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }
            }, true);
            
            // Additional MetaMask conflict prevention
            try {
              Object.defineProperty(window, '_metamaskConflictHandled', { value: true });
            } catch(e) { /* ignore */ }
            
            // Fix service worker redirect issues
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                  registration.unregister();
                }
              });
              if ('caches' in window) {
                caches.keys().then(function(cacheNames) {
                  return Promise.all(cacheNames.map(function(cacheName) {
                    return caches.delete(cacheName);
                  }));
                });
              }
            }
          `
        }} />
      </head>
      <body className="bg-provn-bg text-provn-text antialiased" suppressHydrationWarning={true}>
        <GoogleAnalytics />
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
