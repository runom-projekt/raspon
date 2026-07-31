import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { APP_DESCRIPTION, APP_NAME, SITE_URL } from "@/lib/constants";
import { getSession } from "@/lib/auth";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { prisma } from "@/lib/prisma";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME} — Anhänger mieten online`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "Anhänger mieten",
    "Anhänger Vermietung",
    "Anhängerverleih",
    "Autotransporter mieten",
    "Wohnwagen mieten",
    "Anhänger vermieten",
  ],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "de_DE",
    alternateLocale: ["en_US"],
    siteName: APP_NAME,
    title: `${APP_NAME} — Anhänger mieten online`,
    description: APP_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Anhänger mieten online`,
    description: APP_DESCRIPTION,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1c1f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const accountHref = session
    ? session.role === "ADMIN"
      ? "/admin"
      : session.role === "OWNER" ? "/dashboard" : "/buchungen"
    : "/anmelden";
  const unreadCount = session ? await prisma.notification.count({ where: { userId: session.sub, channel: "IN_APP", readAt: null } }) : 0;

  return (
    <html lang="de" className={inter.variable}>
      <body className="font-sans">
        {children}
        <MobileBottomNav
          accountHref={accountHref}
          messagesHref={session ? "/nachrichten" : "/anmelden?returnTo=%2Fnachrichten"}
          unreadCount={unreadCount}
        />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
