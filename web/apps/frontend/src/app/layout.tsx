import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hedgemony: Takeoff",
  description: "A 7-faction AI-race wargame.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative z-10">{children}</body>
    </html>
  );
}
