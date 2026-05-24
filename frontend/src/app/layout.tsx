import React from "react";
import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ritual Mosaic — Community PFP Canvas",
  description: "Claim your diamond slot in the Ritual logo mosaic. 133 slots, permanent, onchain.",
  openGraph: { title: "Ritual Mosaic", description: "Be part of the Ritual community mosaic permanently onchain." },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
