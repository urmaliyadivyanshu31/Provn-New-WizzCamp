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
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
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
