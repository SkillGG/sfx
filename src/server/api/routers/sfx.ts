import type z from "zod/v4";
import { object, string, number, array, literal } from "zod/v4";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { CollapsedOnomatopoeia, CollapsedTL, type SFXData } from "@/utils";
import type { Onomatopoeia } from "@prisma/client";
import { checkSession } from "./user";
import type { PrismaClient } from "@prisma/client";

type SimpleCollapsedTL = Omit<CollapsedTL, "tlSFX"> &
  ({ tlSFX: SFXData } | { ogSFX: SFXData });

const collapseSFX = (
  ogSFX: Onomatopoeia | SFXData,
  tls?: SimpleCollapsedTL[],
): CollapsedOnomatopoeia => {
  const sfx = {
    ...ogSFX,
    tls:
      tls?.map((tl): CollapsedTL => {
        return {
          ...tl,
          tlSFX: "tlSFX" in tl ? collapseSFX(tl.tlSFX) : collapseSFX(tl.ogSFX),
        };
      }) ?? [],
  };
  return sfx;
};

const authShape = object({ token: string(), deviceName: string() });

const SearchOptions = object({
  limit: number().default(100).optional(),
  skip: number().default(0).optional(),
  query: string(),
  langs: array(string()).optional(),
}).or(object({ order: literal("asc").or(literal("desc")).default("asc") }));

const searchDBForSFX = async (
  db: PrismaClient,
  search: z.infer<typeof SearchOptions>,
) => {
  console.log("Searching for", search);

  if ("order" in search) return [];

  const sfx = await db.onomatopoeia.findMany({
    take: search.limit,
    skip: search.skip,
    orderBy: { id: "asc" },
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
        {
          OR: [
            {
              language: { in: search.langs },
            },
            { id: { gte: search.langs?.length === 0 ? 0 : 999999999 } },
          ],
        },
        {
          OR: [
            {
              text: { contains: search.query, mode: "insensitive" },
            },
            {
              read: { contains: search.query, mode: "insensitive" },
            },
            {
              extra: { contains: search.query, mode: "insensitive" },
            },
            {
              def: { contains: search.query, mode: "insensitive" },
            },
          ],
        },
      ],
    },
  });

  const collapsedSFXs = sfx.map((pSFX) => {
    return collapseSFX(pSFX, [...pSFX.ogTranslations, ...pSFX.tlTranslations]);
  });

  return collapsedSFXs;
};

export const sfxRouter = createTRPCRouter({
  listSFX: publicProcedure
    .input(SearchOptions.optional())
    .query(async ({ ctx, input }): Promise<CollapsedOnomatopoeia[]> => {
      const search = !input
        ? undefined
        : "order" in input
          ? input.order
          : input;

      if (typeof search === "object")
        return await searchDBForSFX(ctx.db, search);

      const sfx = await ctx.db.onomatopoeia.findMany({
        orderBy: { id: search ?? "asc" },
        select: {
          def: true,
          extra: true,
          id: true,
          language: true,
          prime: true,
          read: true,
          text: true,
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
      });

      const collapsed = sfx.map((s) => {
        const collapsed = collapseSFX(s, [
          ...s.ogTranslations,
          ...s.tlTranslations,
        ]);
        return collapsed;
      });

      return collapsed;
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
              tlSFX: object({
                ...CollapsedOnomatopoeia.shape,
              }).omit({ tls: true }),
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
        const loggedIn = await checkSession(ctx.db, { token, deviceName });

        if (loggedIn.ok) {
          const ogUpdates = tls.filter((q) => q.tlSFX.prime);
          const tlUpdates = tls.filter((q) => !q.tlSFX.prime);

          console.log(
            "forDeletion",
            [...ogUpdates, ...tlUpdates].filter((q) => q.forDeletion),
          );

          await ctx.db.onomatopoeia.update({
            where: { id },
            data: {
              text,
              def,
              extra,
              read,
              language,
              tlTranslations: {
                delete: ogUpdates
                  .filter((up) => up.forDeletion && isFinite(up.id))
                  .map((fd) => ({ id: fd.id })),
                upsert: ogUpdates
                  .filter((up) => !up.forDeletion)
                  .map((tlu) => ({
                    where: { id: isFinite(tlu.id) ? tlu.id : -1 },
                    create: {
                      additionalInfo: tlu.additionalInfo,
                      createdAt: new Date(),
                      ogSFX: {
                        connectOrCreate: {
                          create: {
                            updatedAt: new Date(),
                            prime: false,
                            def: tlu.tlSFX.def,
                            text: tlu.tlSFX.text,
                            read: tlu.tlSFX.read,
                            extra: tlu.tlSFX.extra,
                            language: tlu.tlSFX.language,
                          },
                          where: {
                            id: isFinite(tlu.tlSFX.id) ? tlu.tlSFX.id : -1,
                          },
                        },
                      },
                    },
                    update: {
                      additionalInfo: tlu.additionalInfo,
                      createdAt: new Date(),
                      ogSFX: {
                        upsert: {
                          create: {
                            updatedAt: new Date(),
                            prime: false,
                            def: tlu.tlSFX.def,
                            text: tlu.tlSFX.text,
                            read: tlu.tlSFX.read,
                            extra: tlu.tlSFX.extra,
                            language: tlu.tlSFX.language,
                          },
                          update: {
                            updatedAt: new Date(),
                            def: tlu.tlSFX.def,
                            text: tlu.tlSFX.text,
                            read: tlu.tlSFX.read,
                            extra: tlu.tlSFX.extra,
                            language: tlu.tlSFX.language,
                          },
                        },
                      },
                    },
                  })),
              },
              ogTranslations: {
                delete: tlUpdates
                  .filter((up) => up.forDeletion && isFinite(up.id))
                  .map((fd) => ({ id: fd.id })),
                upsert: tlUpdates
                  .filter((up) => !up.forDeletion)
                  .map((tlu) => ({
                    where: { id: isFinite(tlu.id) ? tlu.id : -1 },
                    create: {
                      additionalInfo: tlu.additionalInfo,
                      createdAt: new Date(),
                      tlSFX: {
                        connectOrCreate: {
                          create: {
                            updatedAt: new Date(),
                            prime: false,
                            def: tlu.tlSFX.def,
                            text: tlu.tlSFX.text,
                            read: tlu.tlSFX.read,
                            extra: tlu.tlSFX.extra,
                            language: tlu.tlSFX.language,
                          },
                          where: {
                            id: isFinite(tlu.tlSFX.id) ? tlu.tlSFX.id : -1,
                          },
                        },
                      },
                    },
                    update: {
                      additionalInfo: tlu.additionalInfo,
                      createdAt: new Date(),
                      tlSFX: {
                        upsert: {
                          create: {
                            updatedAt: new Date(),
                            prime: false,
                            def: tlu.tlSFX.def,
                            text: tlu.tlSFX.text,
                            read: tlu.tlSFX.read,
                            extra: tlu.tlSFX.extra,
                            language: tlu.tlSFX.language,
                          },
                          update: {
                            updatedAt: new Date(),
                            def: tlu.tlSFX.def,
                            text: tlu.tlSFX.text,
                            read: tlu.tlSFX.read,
                            extra: tlu.tlSFX.extra,
                            language: tlu.tlSFX.language,
                          },
                        },
                      },
                    },
                  })),
              },
            },
          });
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
        const ogSFX = await ctx.db.onomatopoeia.create({
          data: {
            text,
            def,
            extra,
            prime: true,
            read: read ?? null,
            language,
            ogTranslations: {
              create: tls.map((tl) => ({
                tlSFX: {
                  connectOrCreate: {
                    create: {
                      text: tl.tlSFX.text,
                      def: tl.tlSFX.def,
                      prime: false,
                      language: tl.tlSFX.language,
                      extra: tl.tlSFX.extra,
                      read: tl.tlSFX.read,
                    },
                    where: { id: isFinite(tl.tlSFX.id) ? tl.tlSFX.id : -1 },
                  },
                },
              })),
            },
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
