import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers";
import { OfflineDetector } from "@/components/shared";

export const metadata: Metadata = {
  title: {
    default: "Next.js Boilerplate",
    template: "%s | Boilerplate",
  },
  description: "Next.js + Supabase + Tailwind CSS Boilerplate",
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Boilerplate",
  },

  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  applicationName: "Boilerplate",
  authors: [{ name: "Your Name" }],
  keywords: ["nextjs", "boilerplate", "supabase", "tailwind"],
  category: "application",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Boilerplate" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL}
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <OfflineDetector />
        </AuthProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}