import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Linkup Communications - Billing System",
  description: "ISP billing management system for staff payment collection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
