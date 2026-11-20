import type { Metadata } from "next";
import "./globals.css";
import { DisplayPreferencesControl, DisplayPreferencesProvider } from "@/components/display-preferences";

export const metadata: Metadata = {
  title: "MedVita — Your Health. Your Life.",
  description:
    "A simple, life-stage-aware healthcare companion. Explore MedVita with fictional demonstration profiles.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><DisplayPreferencesProvider><DisplayPreferencesControl />{children}</DisplayPreferencesProvider></body>
    </html>
  );
}
