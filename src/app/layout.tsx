import type { Metadata } from "next";
import "./globals.css";
import { VaultProvider } from "@/context/VaultProvider";

export const metadata: Metadata = {
  title: "Aegis — Team Vault",
  description:
    "A zero-knowledge team password manager. Encryption happens in your browser; the master password never leaves your device.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <VaultProvider>{children}</VaultProvider>
      </body>
    </html>
  );
}
