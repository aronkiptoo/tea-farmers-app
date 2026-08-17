import type { Metadata } from "next";
import "./globals.css";

const factoryName =
  process.env.NEXT_PUBLIC_FACTORY_NAME || "Chebango EPZ Tea Factory";

export const metadata: Metadata = {
  title: `${factoryName} — Farmers Portal`,
  description: "Grower number verification and farmer management for Chebango EPZ Tea Factory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-green-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}