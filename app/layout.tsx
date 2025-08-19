import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import Providers from "@/components/providers"
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics"

const inter = Inter({
  display: "swap",
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Provn - Own Your Content, Own Your Future",
  description: "First short-form video platform with on-chain IP protection on Camp Network",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js" type="application/javascript"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Ensure ethers is available globally
            window.addEventListener('load', function() {
              if (typeof window.ethers === 'undefined') {
                console.error('Ethers.js failed to load from CDN, trying fallback...');
                // Fallback: load from alternative CDN
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js';
                script.onload = function() {
                  console.log('Ethers.js loaded from fallback CDN');
                  // Dispatch custom event when ethers is loaded
                  window.dispatchEvent(new CustomEvent('ethersLoaded'));
                };
                script.onerror = function() {
                  console.error('All CDN sources failed to load ethers.js');
                  // Dispatch custom event when ethers fails to load
                  window.dispatchEvent(new CustomEvent('ethersLoadFailed'));
                };
                document.head.appendChild(script);
              } else {
                console.log('Ethers.js loaded successfully from primary CDN');
                // Dispatch custom event when ethers is already loaded
                window.dispatchEvent(new CustomEvent('ethersLoaded'));
              }
            });
          `
        }} />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          /* Mozilla Headline font - using a similar alternative since Mozilla Headline isn't available on Google Fonts */
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
          
          html {
            font-family: ${inter.style.fontFamily};
            --font-inter: ${inter.variable};
            --font-headline: 'Space Grotesk', sans-serif;
          }
        `}</style>
      </head>
      <body className="bg-provn-bg text-provn-text antialiased" suppressHydrationWarning={true}>
        <GoogleAnalytics />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
