import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "SFX Vault Creator",
  description: "An editor for all on-site SFXs",
  keywords: ["sfx", "editor", "japanese", "creation"],
  openGraph: {
    type: "website",
    description: "An editor for all on-site SFXs",
    title: "SFX Vault Creator",
    determiner: "the",
    emails: ["request@sfxvault.org"],
    siteName: "SFX Vault",
    url: "https://sfxvault.org/creator",
  },
};
export default function ClientLayout({ children }: { children: ReactNode }) {
  return children;
}
