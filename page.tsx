import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relay Load Calculator",
  description: "Relay Logistics load profit calculator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
