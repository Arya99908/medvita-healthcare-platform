import type { Metadata } from "next";
import "./globals.css";
import "./medvita-demo.css";
import { DisplayPreferencesControl, DisplayPreferencesProvider } from "@/components/display-preferences";

export const metadata: Metadata = {
  title: "MEDVITA · Your connected care companion",
  description: "A fictional, frontend-only healthcare demonstration. Your Health. Your Life. One Connected Ecosystem.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><DisplayPreferencesProvider><DisplayPreferencesControl />{children}</DisplayPreferencesProvider></body>
    </html>
  );
}
