import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
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
      <body className="bg-provn-bg text-provn-text antialiased">{children}</body>
    </html>
  )
}
