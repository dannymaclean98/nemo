import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Nemo - NFT Photo Albums",
  description: "Mint your photo collections as NFTs on Base",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="animated-bg cyber-grid">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
