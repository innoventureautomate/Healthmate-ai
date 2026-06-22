import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import PwaRegister from "@/components/pwa-register"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HealthMate - Your all-in-one health partner",
  description: "Track your workouts, nutrition, and fitness progress all in one place.",
  generator: 'v0.dev',
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HealthMate",
  },
  formatDetection: { telephone: false },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0f766e",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <div className="flex-1">{children}</div>
              <SiteFooter />
            </div>
            <PwaRegister />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}