import type { Metadata } from "next";
import { SearchPage } from "./main";
import { api } from "@/trpc/server";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const paramStr = (q: string | string[], joiner = ""): string =>
  typeof q === "string" ? q : q.join(joiner);

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const basicMetadata: Metadata = {
    metadataBase: new URL("https://sfxvault.org/"),
    title: "SFX Vault",
    description:
      "A searchable collection of manga sound effects (onomatopoeia) with translations across multiple languages.",
    openGraph: {
      type: "website",
      title: `SFX Vault - a searchhable collection of manga sound effects with translations!`,
      description:
        "A searchable collection of manga sound effects (onomatopoeia) with translations across multiple languages.",
      determiner: "the",
      emails: ["contact@sfxvault.org"],
      siteName: "SFX Vault",
      url: "https://sfxvault.org",
    },
  };

  // read route params
  const qs = await searchParams;

  const q = qs ? ("q" in qs ? qs.q : "") : "";

  const query = q ?? "";

  const id = qs ? ("id" in qs ? qs.id : "") : "";

  const l = qs ? ("l" in qs ? qs.l : "") : "";

  const langs = paramStr(l ?? "")
    .split(",")
    .filter(Boolean);

  const langStr = `${langs.length > 0 ? `${langs.map((q) => `[${q}]`).join(",")} ` : ""}`;

  if (id) {
    const intID = Number(paramStr(id));

    if (intID > 0) {
      const sfx = await api.sfx.listSFX({ id: intID });

      if (sfx.length > 0) {
        return {
          ...basicMetadata,
          title: `SFX Vault - ${langStr}${sfx[0]?.text ?? `#${intID}`}`,
        };
      }
    }
  }

  if (query) {
    return {
      ...basicMetadata,
      title: `SFX Vault - ${langStr}${paramStr(query)}`,
    };
  }

  if (langStr.length > 0) {
    return {
      ...basicMetadata,
      title: `SFX Vault - ${langStr}`,
    };
  }

  return basicMetadata;
}

export default function Home({}: Props) {
  return <SearchPage />;
}
