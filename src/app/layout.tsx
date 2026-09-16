import type { Metadata } from "next";
import "./globals.css";
import { AiAssistantPopup } from "@/components/AiAssistantPopup";

export const metadata: Metadata = {
  title: "Themefisher Admin Tools",
  description:
    "Themefisher Admin Tools – Invoice & Form-C Generator and SCB Bulk Transaction Generator",
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased" suppressHydrationWarning>
        {children}
        <AiAssistantPopup />
      </body>
    </html>
  );
}
