import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relay Load Calculator V3",
  description: "Relay Logistics driver profitability calculator",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
