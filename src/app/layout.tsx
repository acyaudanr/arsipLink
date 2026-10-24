import type { Metadata } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { getCurrentProfile } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arsip — Google Drive Spreadsheet Viewer",
  description: "Kelola folder arsip dan baca spreadsheet Google Drive secara online.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <html lang="id" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen font-[family-name:var(--font-sans)] antialiased">
        {profile && <AppHeader email={profile.email} role={profile.role} />}
        <main>{children}</main>
      </body>
    </html>
  );
}
