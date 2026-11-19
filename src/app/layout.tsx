import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedVita — Your Health. Your Life.",
  description:
    "A simple, life-stage-aware healthcare companion. Explore MedVita with fictional demonstration profiles.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
