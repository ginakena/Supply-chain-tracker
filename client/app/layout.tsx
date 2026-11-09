
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Supply Chain Tracker",
  description:
    "Track goods on-chain from manufacturer to consumer, and verify authenticity at every step.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-body text-ink antialiased">
        <Providers>
          <Header />
          <main className="mx-auto max-w-5xl px-5 py-10">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
