import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "spotify playlist editor",
  description: "personal-use spotify playlist editor",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
