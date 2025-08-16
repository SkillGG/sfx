import type z from "zod/v4";
import { object, string, number, array } from "zod/v4";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { CollapsedOnomatopoeia, type CollapsedTL, type SFXData } from "@/utils";
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
});

const searchDBForSFX = async (
  db: PrismaClient,
  search: z.infer<typeof SearchOptions>,
) => {
  console.log("Searching for", search);
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
    },
    where: {
      AND: [
        { prime: true },
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
    return collapseSFX(pSFX, pSFX.ogTranslations);
  });

  return collapsedSFXs;
};

export const sfxRouter = createTRPCRouter({
  listSFX: publicProcedure
    .input(SearchOptions.optional())
    .query(async ({ ctx, input }): Promise<CollapsedOnomatopoeia[]> => {
      if (input?.query || input?.langs?.length) {
        return await searchDBForSFX(ctx.db, input);
      }

      const sfx = await ctx.db.onomatopoeia.findMany({
        orderBy: { id: "asc" },
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
        sfx: CollapsedOnomatopoeia.omit({ id: true }),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          auth: { token, deviceName },
          id,
          sfx: { text, def, extra, read, language },
        },
      }) => {
        const loggedIn = await checkSession(ctx.db, { token, deviceName });

        if (loggedIn.ok)
          return await ctx.db.onomatopoeia.update({
            where: { id },
            data: { text, def, extra, read, language },
          });
        else return loggedIn;
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
          },
        });

        // create all TL SFX
        const tlSFXs = await Promise.all(
          Object.values(tls).map(
            async ({ tlSFX: { def, extra, language, prime, read, text } }) => {
              return await ctx.db.onomatopoeia.create({
                data: {
                  prime,
                  text,
                  def,
                  extra,
                  read: read ?? null,
                  language,
                  ogTranslations: {
                    connect: {
                      id: ogSFX.id,
                    },
                  },
                },
              });
            },
          ),
        );

        return { ogSFX, tlSFXs };
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
