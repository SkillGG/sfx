import type z from "zod/v4";
import { object, string, number, array, literal } from "zod/v4";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { CollapsedOnomatopoeia, CollapsedTL, type SFXData } from "@/utils";
import { checkSession } from "./user";
import type { PrismaClient } from "@prisma/client";

const authShape = object({ token: string(), deviceName: string() });

const BasicSearch = object({
  limit: number().default(100).optional(),
  skip: number().default(0).optional(),
  query: string(),
  langs: array(string()).optional(),
});

type BasicSearch = z.infer<typeof BasicSearch>;

const SearchOptions = BasicSearch.or(
  object({
    order: literal("asc").or(literal("desc")).default("asc"),
    limit: number().default(100).optional(),
    skip: number().default(0).optional(),
  }),
).or(literal("list"));

type SearchOptions = z.infer<typeof SearchOptions>;

const sfxGetTLs = async (
  db: PrismaClient,
  sfxs: {
    id: number;
    text: string;
    read: string | null;
    def: string;
    extra: string | null;
    language: string;
    show?: "both" | "reverse";
    hideTLSFXs?: number[];
  }[],
  reverse?: boolean,
) => {
  const Collapsed: CollapsedOnomatopoeia[] = [];

  const sfxsWithTL = await Promise.all(
    sfxs.map(async (sfx) => {
      return {
        sfx,
        tls: [
          ...(await db.translation.findMany({
            where: {
              OR: [
                {
                  ogSFX: {
                    id: sfx.show === "reverse" ? -1 : sfx.id,
                  },
                },
                {
                  tlSFX: {
                    id: !sfx.show ? -1 : sfx.id,
                  },
                },
              ],
            },
            include: {
              tlSFX: true,
              ogSFX: true,
            },
          })),
        ],
      };
    }),
  );

  for (const sfxWithTL of sfxsWithTL) {
    const collapsedTLs: CollapsedTL[] = [];

    for (const tl of sfxWithTL.tls) {
      const useOG = tl.ogSFX.id !== sfxWithTL.sfx.id;
      const oppositeSFX = !useOG
        ? tl.tlSFX
        : sfxWithTL.sfx.show === "both"
          ? tl.ogSFX
          : null;

      if (!oppositeSFX) continue;

      if (sfxWithTL.sfx.hideTLSFXs?.includes(oppositeSFX.id)) continue;
      if (oppositeSFX.id === sfxWithTL.sfx.id) continue;

      collapsedTLs.push({
        additionalInfo: (useOG ? "⏉" : "") + (tl.additionalInfo ?? ""),
        id: tl.id,
        sfx1Id: tl.sfx1Id,
        sfx2Id: tl.sfx2Id,
        sfx: {
          ...oppositeSFX,
          tls: [],
        },
      });
    }

    if (
      collapsedTLs.length === 0 &&
      Collapsed.some((q) => q.tls.some((x) => x.sfx.id === sfxWithTL.sfx.id))
    )
      continue;

    Collapsed.push({ ...sfxWithTL.sfx, tls: collapsedTLs });
  }

  return reverse ? Collapsed.reverse() : Collapsed;
};

const sfxContains = (sfx: SFXData, search: string) => {
  const rx = new RegExp(search, "i");
  return (
    rx.test(sfx.def) ||
    rx.test(sfx.extra ?? "") ||
    rx.test(sfx.read ?? "") ||
    rx.test(sfx.text)
  );
};

const searchDBForSFX = async (
  db: PrismaClient,
  search: Required<SearchOptions>,
): Promise<CollapsedOnomatopoeia[]> => {
  if (search === "list" || "order" in search) return [];

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

  return (await sfxGetTLs(db, deduped)).slice(
    search.skip,
    search.limit + search.skip,
  );
};

export const sfxRouter = createTRPCRouter({
  listSFX: publicProcedure
    .input(SearchOptions.optional())
    .query(async ({ ctx, input }): Promise<CollapsedOnomatopoeia[]> => {
      const search = !input
        ? undefined
        : typeof input === "object" && "order" in input
          ? input
          : typeof input === "string"
            ? input
            : ({
                langs: input.langs ?? [],
                limit: input.limit ?? 100,
                query: input.query,
                skip: input.skip ?? 0,
              } as Required<BasicSearch>);

      if (
        typeof search === "object" &&
        !("order" in search) &&
        (search.query || search.langs.length > 0)
      )
        return await searchDBForSFX(ctx.db, search);

      const sfxs = await ctx.db.onomatopoeia.findMany({
        orderBy: { id: "asc" },
        select: {
          def: true,
          extra: true,
          id: true,
          language: true,
          read: true,
          text: true,
        },
      });

      if (search === "list") return sfxs.map((q) => ({ ...q, tls: [] }));

      const reverse = search && "order" in search && search.order === "desc";

      const ret = await sfxGetTLs(ctx.db, sfxs, reverse);

      console.log(search);

      const limit = search?.limit ?? 100;
      const skip = search?.skip ?? 0;

      return typeof search === "object" ? ret.slice(skip, limit + skip) : ret;
    }),

  updateSFX: publicProcedure
    .input(
      object({
        auth: authShape,
        id: number(),
        sfx: object({
          ...CollapsedOnomatopoeia.shape,
          tls: array(
            object({
              ...CollapsedTL.shape,
              sfx: object({
                ...CollapsedOnomatopoeia.shape,
              }),
            }),
          ),
        }),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          auth: { token, deviceName },
          id,
          sfx: { text, def, extra, read, language, tls },
        },
      }) => {
        const flattenTLs: (t: CollapsedTL[]) => CollapsedTL[] = (tls) => {
          return tls
            .map<CollapsedTL[]>((tl) => {
              if (!tl.sfx.tls || tl.sfx.tls.length === 0) return [tl];
              return [tl, ...flattenTLs(tl.sfx.tls)];
            })
            .flat(100);
        };

        const allTLs = flattenTLs(tls);

        const loggedIn = await checkSession(ctx.db, { token, deviceName });

        if (loggedIn.ok) {
          const sfxUpdates = [
            { text, def, extra, read, language, id },
            ...allTLs.filter((s) => isFinite(s.sfx.id)).map((q) => q.sfx),
          ];

          // update every SFX
          await Promise.all(
            sfxUpdates.map(async (sfx) => {
              if (isFinite(sfx.id))
                return await ctx.db.onomatopoeia.update({
                  where: { id: sfx.id },
                  data: {
                    def: sfx.def,
                    extra: sfx.extra,
                    language: sfx.language,
                    read: sfx.read,
                    text: sfx.text,
                    updatedAt: new Date(),
                  },
                });
            }),
          );

          for (const tl of allTLs) {
            // update the tls
            if (tl.forDeletion) {
              await ctx.db.translation.delete({ where: { id: tl.id } });
              continue;
            }

            if (!isFinite(tl.id) || !isFinite(tl.sfx2Id)) {
              await ctx.db.onomatopoeia.upsert({
                where: { id: isFinite(tl.sfx.id) ? tl.sfx.id : -1 },
                create: {
                  def: tl.sfx.def,
                  read: tl.sfx.read,
                  text: tl.sfx.text,
                  language: tl.sfx.language,
                  extra: tl.sfx.extra,
                  tlTranslations: {
                    create: {
                      additionalInfo: tl.additionalInfo,
                      ogSFX: { connect: { id: tl.sfx1Id } },
                    },
                  },
                },
                update: {
                  updatedAt: new Date(),
                  def: tl.sfx.def,
                  read: tl.sfx.read,
                  text: tl.sfx.text,
                  language: tl.sfx.language,
                  extra: tl.sfx.extra,
                  tlTranslations: {
                    create: {
                      additionalInfo: tl.additionalInfo,
                      ogSFX: { connect: { id: tl.sfx1Id } },
                    },
                  },
                },
              });
              continue;
            }
            await ctx.db.translation.update({
              where: { id: tl.id },
              data: {
                additionalInfo: tl.additionalInfo,
                updatedAt: new Date(),
              },
            });
          }

          return;
        } else return loggedIn;
      },
    ),

  createSFX: publicProcedure
    .input(
      CollapsedOnomatopoeia.omit({ id: true }).and(object({ auth: authShape })),
    )
    .mutation(
      async ({
        ctx,
        input: { auth, text, def, extra, read, tls, language },
      }) => {
        const loggedIn = await checkSession(ctx.db, auth);
        if (!loggedIn.ok) return loggedIn;
        // create og SFX

        type CreateCreateObject = {
          def: string;
          extra: string | null;
          language: string;
          read: string | null;
          text: string;
          ogTranslations: {
            create: {
              additionalInfo: string | null;
              tlSFX: {
                connectOrCreate: {
                  where: { id: number };
                  create: CreateCreateObject;
                };
              };
            }[];
          };
        };

        const createCreateObject = ({
          def,
          extra,
          language,
          read,
          text,
          tls,
        }: Omit<CreateCreateObject, "ogTranslations"> & {
          tls: CollapsedTL[];
        }): CreateCreateObject => {
          return {
            text,
            def,
            extra,
            read,
            language,
            ogTranslations: {
              create: tls.map((tl) => ({
                additionalInfo: tl.additionalInfo,
                tlSFX: {
                  connectOrCreate: {
                    where: { id: isFinite(tl.sfx.id) ? tl.sfx.id : -1 },
                    create: createCreateObject(tl.sfx),
                  },
                },
              })),
            },
          };
        };

        const createObject = createCreateObject({
          def,
          extra,
          language,
          read,
          text,
          tls,
        });

        const ogSFX = await ctx.db.onomatopoeia.create({
          data: {
            ...createObject,
          },
        });

        return { ogSFX };
      },
    ),

  removeSFX: publicProcedure
    .input(object({ id: number(), auth: authShape }))
    .mutation(async ({ ctx, input: { id, auth } }) => {
      const loggedIn = await checkSession(ctx.db, auth);
      if (!loggedIn.ok) return loggedIn;
      return await ctx.db.onomatopoeia.delete({
        where: { id },
      });
    }),
});
