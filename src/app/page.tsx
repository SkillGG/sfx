import type { Metadata } from "next";
import { SearchPage } from "./main";
import { api } from "@/trpc/server";
import type { SearchParams } from "@/utils/utils";
import { searchParamsToQuery, searchQueryToString } from "@/utils/searchUtils";

type Props = {
  searchParams: SearchParams;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;
  const query = searchParamsToQuery(params);
  const searchStr = searchQueryToString(query);

  const basicMetadata: Metadata = {
    metadataBase: new URL("https://www.sfxvault.org/"),
    alternates: {
      canonical: `https://www.sfxvault.org${!!searchStr ? `/${searchStr}` : ""}`,
    },
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

  const langs = query?.langs ?? [];

  const langStr = `${langs.length > 0 ? `${langs.map((q) => `[${q}]`).join(",")} ` : ""}`;

  if (query?.id) {
    const intID = Number(query.id);

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

  if (query?.query) {
    return {
      ...basicMetadata,
      title: `SFX Vault - ${langStr}${query.query}`,
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

export default async function Home({ searchParams }: Props) {
  return <SearchPage searchParams={await searchParams} />;
}
