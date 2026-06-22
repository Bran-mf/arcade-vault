import type { Metadata } from "next";
import { Press_Start_2P, JetBrains_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arcade Vault · Portal Retro",
  description: "Retro arcade game library",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${pressStart2P.variable} ${jetBrainsMono.variable}`}>
      <body>
        <div className="av-bg" />
        <div className="av-noise" />
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Nav />
          <main className="av-main">{children}</main>
          <footer style={{ borderTop: "1px solid var(--line)", padding: "16px 32px", textAlign: "center", fontFamily: "var(--pixel)", fontSize: "9px", color: "var(--ink-faint)", letterSpacing: "0.14em" }}>
            ARCADE VAULT © 2026 — INSERT COIN
          </footer>
        </div>
      </body>
    </html>
  );
}
