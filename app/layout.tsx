import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CST Work Tracker",
  description: "Non-clinical task tracker",
  icons: { apple: '/apple-touch-icon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
