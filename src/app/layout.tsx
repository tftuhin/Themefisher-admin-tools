import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Business Finance & Banking Suite",
  description: "Unified Suite for Inward Remittance Form-C, Invoicing, and SCB Bulk Transaction Excel Generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
