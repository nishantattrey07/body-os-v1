import { ReactQueryProvider } from "@/lib/react-query";
import { SessionProvider } from "@/lib/session-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Teko } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const teko = Teko({
  subsets: ["latin"],
  variable: "--font-teko",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Body OS",
  description: "Your personal workout companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${teko.variable} antialiased`}
      >
        <SessionProvider>
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </SessionProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
