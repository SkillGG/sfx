import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { SFXLangProvider } from "./hooks/langs";
import { DarkModeProvider } from "./hooks/darkmode";
import { cn } from "@/utils";

export const metadata: Metadata = {
  title: "SFX Vault",
  description: "Vault fr SFX",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
      <body
        className={cn("m-0 h-full w-full bg-gray-50 p-0 dark:bg-slate-900")}
      >
        <TRPCReactProvider>
          <SFXLangProvider>
            <DarkModeProvider>{children}</DarkModeProvider>
          </SFXLangProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
