import type { Metadata } from "next";
import { SearchPage } from "./main";
import { api } from "@/trpc/server";
import { IMAGE_SIZE, type SearchParams } from "@/utils/utils";
import { searchParamsToQuery } from "@/utils/searchUtils";
import { parseSFXFields } from "@/utils/parse/sfxParse";

type Props = {
  searchParams: SearchParams;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;
  const query = searchParamsToQuery(params);

  const baseURL = `http://localhost:3000`;
  // const baseURL = `https://www.sfxvault.org`;

  const curURL = new URL(`${baseURL}`);

  if (params)
    Object.entries(params).forEach(([k, v]) => {
      console.log("setting param", k, v);
      if (v) curURL.searchParams.set(k, Array.isArray(v) ? v.join(",") : v);
      else curURL.searchParams.delete(k);
    });

  const keywords = ["SFX", "onomatopoeia", "SFX translation", "japansese sfx"];

  const basicMetadata: Metadata = {
    metadataBase: null,
    alternates: {
      canonical: curURL.href,
    },
    title: "SFX Vault",
    keywords,
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
      url: curURL.href,
    },
  };

  // TODO do query always, just return different metadata based on the result count
  if (query?.query || query?.id || query?.langs?.length) {
    const searchResult = await api.sfx.listSFX(query);

    let title = `SFX Vault`;
    let twitterTitle = "";
    let description = basicMetadata.description ?? "";

    const twitterImage = `${baseURL}/api/images?id=${query.id}`;

    console.log("metadata IMG", twitterImage);

    if (searchResult.length > 0) {
      keywords.push(
        ...searchResult
          .map((q) => [
            q.text + " translation",
            q.text + " TL",
            q.text + q.language,
          ])
          .flat(2),
      );
      if (searchResult.length === 1 && searchResult[0]) {
        const sfx = searchResult[0];
        const parsed = parseSFXFields({
          def: sfx.def,
          extra: sfx.extra,
          read: sfx.read,
        });
        const read = parsed.read
          ? (parsed.read.find((q) => q.type === "string")?.value ?? "")
          : "";
        title = `${sfx.text} - SFX Vault`;
        twitterTitle = `${sfx.text}${read ? ` (${read})` : ""} - SFX Vault`;
        description =
          [...(parsed.def ?? []), ...(parsed.extra ?? [])]
            ?.filter((q) => q.type === "string")
            .reduce((p, n) => `${p}${p ? "; " : ""}${n.value}`, ``) ??
          description;
      } else if (searchResult.length > 0) {
        title = `(${searchResult.length}) ${query.query ?? ""}${query.langs ? ` [${query.langs.join(",")}]` : ""} - SFX Vault`;
      }
    }

    return {
      ...basicMetadata,
      keywords,
      title,
      description,
      openGraph: {
        ...basicMetadata.openGraph,
        description,
        title,
        images: [{ url: twitterImage, ...IMAGE_SIZE }],
        url: curURL.href,
      },
      twitter: {
        card: "summary",
        site: "sfxvault",
        creator: "_skillu_",
        description:
          description.substring(0, 196) +
          `${description.length > 196 ? "..." : ""}`,
        title: !!twitterTitle ? twitterTitle : title,
        images: [{ url: twitterImage, ...IMAGE_SIZE }],
      },
    };
  }

  return basicMetadata;
}

export default async function Home({ searchParams }: Props) {
  return <SearchPage searchParams={await searchParams} />;
}
