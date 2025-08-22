import "@/styles/globals.css";

import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { SFXLangProvider } from "./hooks/langs";
import { ThemeProvider } from "./hooks/theme";
import { cn } from "@/utils";

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
