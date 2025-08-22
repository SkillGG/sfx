import type { CollapsedOnomatopoeia, SearchOptions, SFXData } from "@/utils";
import type { PrismaClient } from "@prisma/client";
import { sfxGetTLs } from "./sfx";

const sfxContains = (sfx: SFXData, search: string) => {
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

  const sfxs = await db.onomatopoeia.findMany({
    include: {
      ogTranslations: {
        include: {
          tlSFX: true,
        },
      },
      tlTranslations: {
        include: {
          ogSFX: true,
        },
      },
    },

    where: {
      AND: [
        search.id && search.id > 0 ? { id: search.id } : { id: { gt: -1 } },
        search.langs && search.langs.length > 0
          ? { language: { in: search.langs } }
          : { id: { gt: -1 } },
        {
          OR: [
            {
              def: { contains: search.query },
            },
            {
              extra: { contains: search.query },
            },
            {
              text: { contains: search.query },
            },
            { read: { contains: search.query } },
            {
              ogTranslations: {
                some: {
                  tlSFX: {
                    OR: [
                      {
                        def: { contains: search.query },
                      },
                      {
                        extra: { contains: search.query },
                      },
                      {
                        text: { contains: search.query },
                      },
                      { read: { contains: search.query } },
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
                        def: { contains: search.query },
                      },
                      {
                        extra: { contains: search.query },
                      },
                      {
                        text: { contains: search.query },
                      },
                      { read: { contains: search.query } },
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

  const deduped = sfxs.reduce<
    {
      id: number;
      text: string;
      read: string | null;
      def: string;
      extra: string | null;
      language: string;
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
      language: sfx.language,
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
      if (sfxContains(sfx, search.query)) {
        const prevSFXToHide = prevSFX.filter((psfx) => {
          return !sfxContains(psfx, search.query);
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

  const order = search.order ?? "asc";

  return (await sfxGetTLs(db, deduped, order === "desc")).slice(
    search.skip,
    search.limit + search.skip,
  );
};
