import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MindFlow — Notes, Tasks & Reminders",
  description:
    "Your beautiful, blazing-fast notes, reminders & tasks companion. Organize your thoughts, track your progress, and never miss a beat.",
  manifest: "/manifest.json",
  keywords: ["notes", "tasks", "reminders", "productivity", "todo", "mindflow"],
  authors: [{ name: "MindFlow Team" }],
  openGraph: {
    title: "MindFlow — Notes, Tasks & Reminders",
    description:
      "Your beautiful, blazing-fast productivity companion.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f1a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col overflow-x-hidden w-full relative">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
