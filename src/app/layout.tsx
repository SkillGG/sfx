import "@/styles/globals.css";

import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { SFXLangProvider } from "./hooks/langs";
import { ThemeProvider } from "./hooks/theme";
import { cn } from "@/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SFX Vault",
  description: "An app for SFX Translations",
  metadataBase: new URL("https://sfxvault.org/"),
  openGraph: {
    type: "website",
    description: "An app for SFX Translations",
    determiner: "the",
    emails: ["contact@sfxvault.org"],
    siteName: "SFX Vault",
    url: "https://sfxvault.org",
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(geist.variable)}>
      <body className={cn("m-0 h-full w-full bg-(color:--main-bg) p-0")}>
        <TRPCReactProvider>
          <SFXLangProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </SFXLangProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
