import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Themefisher Admin Tools",
  description: "Themefisher Admin Tools – Invoice & Form-C Generator and SCB Bulk Transaction Generator",
  openGraph: {
    images: ["/og-image.png"],
  },
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
