import { object, string, number, array } from "zod/v4";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { CollapsedOnomatopoeia, type CollapsedTL, type SFXData } from "@/utils";
import type { Onomatopoeia } from "@prisma/client";
import { checkSession } from "./user";

type SimpleCollapsedTL = Omit<CollapsedTL, "tlSFX"> & { tlSFX: SFXData };

const collapseSFX = (
  ogSFX: Onomatopoeia | SFXData,
  tls?: SimpleCollapsedTL[],
): CollapsedOnomatopoeia => {
  const sfx = {
    ...ogSFX,
    tls:
      tls?.map((tl): CollapsedTL => {
        return { ...tl, tlSFX: collapseSFX(tl.tlSFX) };
      }) ?? [],
  };
  return sfx;
};

const authShape = object({ token: string(), deviceName: string() });
const USER_AUTH_ERR = { err: "User not logged in!", errcode: "NO_AUTH" };

export const sfxRouter = createTRPCRouter({
  listSFX: publicProcedure
    .input(
      object({
        limit: number().default(100).optional(),
        skip: number().default(0).optional(),
        query: string(),
        langs: array(string()).optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }): Promise<CollapsedOnomatopoeia[]> => {
      if (input?.query || input?.langs?.length) {
        console.log("Searching for", input);
        const sfx = await ctx.db.onomatopoeia.findMany({
          take: input.limit,
          skip: input.skip,
          orderBy: { id: "asc" },
          include: {
            tlTranslations: {
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
                    language: { in: input.langs },
                  },
                  { id: { gte: input.langs?.length === 0 ? 0 : 999999999 } },
                ],
              },
              {
                OR: [
                  {
                    text: { contains: input.query, mode: "insensitive" },
                  },
                  {
                    read: { contains: input.query, mode: "insensitive" },
                  },
                  {
                    extra: { contains: input.query, mode: "insensitive" },
                  },
                  {
                    def: { contains: input.query, mode: "insensitive" },
                  },
                ],
              },
            ],
          },
        });

        const collapsedSFXs = sfx.map((pSFX) => {
          return collapseSFX(pSFX, pSFX.tlTranslations);
        });

        console.log(collapsedSFXs);

        return collapsedSFXs;
      }

      const sfx = await ctx.db.onomatopoeia.findMany({
        orderBy: { id: "asc" },
        include: {
          tlTranslations: {
            include: {
              tlSFX: true,
            },
          },
        },
      });

      const collapsed = sfx.map((s) => collapseSFX(s, s.tlTranslations));

      return collapsed;
    }),
  getSFX: publicProcedure
    .input(object({ id: number() }))
    .query(
      async ({
        ctx,
        input: { id },
      }): Promise<CollapsedOnomatopoeia | { err: string }> => {
        const primeSFX = await ctx.db.onomatopoeia.findFirst({
          where: {
            OR: [
              { id, prime: true },
              { prime: false, tlTranslations: { some: { tlSFX: { id } } } },
            ],
          },
          include: {
            tlTranslations: {
              include: {
                tlSFX: true,
              },
            },
          },
        });

        if (!primeSFX) return { err: `No SFX with id ${id}` };

        return collapseSFX(primeSFX, primeSFX?.tlTranslations);
      },
    ),

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
