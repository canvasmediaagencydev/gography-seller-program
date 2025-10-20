import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";


export const metadata: Metadata = {
  title: "Paydee Seller Program",
  description: "แพลตฟอร์มผู้ขายสำหรับจัดการร้านค้าและยอดขายของคุณอย่างมีประสิทธิภาพ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/images/paydeeLOGO.svg" type="image/svg+xml" />

        {/* Mobile viewport optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#176daf" />

        {/* Google Fonts preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@100..900&display=swap" rel="stylesheet" />

        {/* Google Auth optimization - preconnect and prefetch */}
        <link rel="preconnect" href="https://accounts.google.com" />
        <link rel="preconnect" href="https://apis.google.com" />
        <link rel="preconnect" href="https://oauth2.googleapis.com" />
        <link rel="dns-prefetch" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://apis.google.com" />
        <link rel="dns-prefetch" href="https://oauth2.googleapis.com" />
      </head>
      <body className="font-noto-thai overflow-x-hidden">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
