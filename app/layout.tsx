import type { Metadata } from "next"
import { DM_Mono } from "next/font/google"
import "./globals.css"

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
})

export const metadata: Metadata = {
  title: "1-800-I-LOVE-MUSIC",
  description: "personal-use spotify playlist editor",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={dmMono.variable}>
      <body>{children}</body>
    </html>
  )
}
