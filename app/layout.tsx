import type { Metadata } from "next"
import { DM_Mono } from "next/font/google"
import Footer from "@/components/footer"
import { SelectionProvider } from "@/components/selection/selection-context"
import SelectedSongsTray from "@/components/selection/tray"
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
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-purple-50 font-mono text-violet-700">
        <SelectionProvider>
          <div className="flex flex-1 flex-row">
            <div className="flex min-w-0 flex-1 flex-col">{children}</div>
            <SelectedSongsTray />
          </div>
          <Footer />
        </SelectionProvider>
      </body>
    </html>
  )
}
