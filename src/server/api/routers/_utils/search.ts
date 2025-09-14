import type {
  CollapsedOnomatopoeia,
  SearchOptions,
  SFXData,
} from "@/utils/utils";
import type { PrismaClient } from "@prisma/client";
import { sfxGetTLs } from "./sfx";

const sfxContains = (sfx: Omit<SFXData, "language">, search: string) => {
  const rx = new RegExp(search, "i");
  return (
    rx.test(sfx.def) ||
    rx.test(sfx.extra ?? "") ||
    rx.test(sfx.read ?? "") ||
    rx.test(sfx.text)
  );
};

export const searchDBForSFX = async (
  db: PrismaClient,
  search: Required<SearchOptions>,
): Promise<CollapsedOnomatopoeia[]> => {
  if (search === "list") return [];

  const query = search.query;

  const sfxs = await db.onomatopoeia.findMany({
    select: {
      def: true,
      extra: true,
      id: true,
      languageId: true,
      createdAt: true,
      updatedAt: true,
      ogTranslations: {
        include: { tlSFX: true },
      },
      tlTranslations: { include: { ogSFX: true } },
      read: true,
      text: true,
    },

    where: {
      AND: [
        search.ids.length > 0
          ? { OR: search.ids.filter((q) => q > 0).map((q) => ({ id: q })) }
          : { id: { gt: -1 } }, // multi ID search
        search.id && search.id > 0 ? { id: search.id } : { id: { gt: -1 } }, // single ID search
        search.langs && search.langs.length > 0 // language search
          ? { language: { id: { in: search.langs } } }
          : { id: { gt: -1 } },
        {
          // text search
          OR: [
            {
              searchdef: { contains: query },
            },
            {
              searchextra: { contains: query },
            },
            {
              text: { contains: query },
            },
            { searchread: { contains: query } },
            {
              ogTranslations: {
                some: {
                  tlSFX: {
                    OR: [
                      {
                        searchdef: { contains: query },
                      },
                      {
                        searchextra: { contains: query },
                      },
                      {
                        text: { contains: query },
                      },
                      { searchread: { contains: query } },
                    ],
                  },
                },
              },
            },
            {
              tlTranslations: {
                some: {
                  ogSFX: {
                    OR: [
                      {
                        searchdef: { contains: query },
                      },
                      {
                        searchextra: { contains: query },
                      },
                      {
                        text: { contains: query },
                      },
                      { searchread: { contains: query } },
                    ],
                  },
                },
              },
            },
          ],
        },
      ],
    },
  });

  const order = search.order ?? "asc";

  if (search.nodedupe) {
    // console.log("NOT DEDUPING!", sfxs);
    return sfxs
      .map(
        (sfx): CollapsedOnomatopoeia => ({
          def: sfx.def,
          extra: sfx.extra,
          id: sfx.id,
          language: sfx.languageId,
          read: sfx.read,
          text: sfx.text,
          tls: [],
        }),
      )
      .slice(search.skip, search.limit + search.skip);
  }

  const deduped = sfxs.reduce<
    {
      id: number;
      text: string;
      read: string | null;
      def: string;
      extra: string | null;
      languageId: string;
      ogtls: (typeof sfxs)[number]["ogTranslations"];
      optls: (typeof sfxs)[number]["tlTranslations"];
      show?: "both" | "reverse";
      hideTLSFXs?: number[];
    }[]
  >((arr, sfx) => {
    const sfxObj = {
      createdAt: sfx.createdAt,
      def: sfx.def,
      extra: sfx.extra,
      id: sfx.id,
      languageId: sfx.languageId,
      read: sfx.read,
      text: sfx.text,
      updatedAt: sfx.updatedAt,
      ogtls: sfx.ogTranslations,
      optls: sfx.tlTranslations,
      show: "both" as "both" | "reverse",
    };

    // get all sfx that have this as opposite sfx
    const prevSFX = arr.filter(
      (v) =>
        v.ogtls.some((tl) => tl.tlSFX.id === sfx.id) ||
        v.optls.some((tl) => tl.ogSFX.id === sfx.id),
    );

    if (prevSFX.length) {
      if (sfxContains(sfx, query)) {
        const prevSFXToHide = prevSFX.filter((psfx) => {
          return !sfxContains(psfx, query);
        });
        if (prevSFXToHide.length > 0) {
          return [
            ...arr.filter((q) => !prevSFXToHide.find((x) => x.id === q.id)),
            {
              ...sfxObj,
            },
          ];
        }
      }

      // add reversed version
      if (
        prevSFX.some((q) => q.show) // if there is a reversed sfx
      ) {
        return [...arr, { ...sfxObj, show: "reverse" as const }];
      }

      // skip it
      return arr;
    }

    return [...arr, sfxObj];
  }, []);

  return (await sfxGetTLs(db, deduped, order === "desc")).slice(
    search.skip,
    search.limit + search.skip,
  );
};
