import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const sfxNoTLSchema = z.object({
  text: z.string(),
  def: z.string(),
  extra: z.string().optional().nullable(),
  read: z.string().optional().nullable(),
  language: z.string(),
});

const sfxTLAssociationSchema = z.object({
  sfxID: z.number(),
});

const sfxSchema = sfxNoTLSchema.and(
  z.object({
    tls: z.record(z.string(), sfxNoTLSchema.or(sfxTLAssociationSchema)),
  }),
);

export const sfxRouter = createTRPCRouter({
  listSFX: publicProcedure
    .input(
      z
        .object({
          limit: z.number().default(100).optional(),
          skip: z.number().default(0).optional(),
          query: z.string(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (input) {
        return await ctx.db.onomatopoeia.findMany({
          take: input.limit,
          skip: input.skip,
          where: {
            OR: [
              {
                text: { contains: input.query, mode: "insensitive" },
              },
              {
                read: { contains: input.query, mode: "insensitive" },
              },
            ],
          },
        });
      }
      const sfx = await ctx.db.onomatopoeia.findMany({
        include: {
          tlTranslations: {
            include: {
              tlSFX: true,
            },
          },
        },
      });

      return sfx;
    }),
  getSFX: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input: { id } }) => {
      return await ctx.db.onomatopoeia.findUnique({
        where: { id },
      });
    }),

  updateSFX: publicProcedure
    .input(sfxNoTLSchema.and(z.object({ id: z.number() })))
    .mutation(
      async ({ ctx, input: { id, text, def, extra, read, language } }) => {
        return await ctx.db.onomatopoeia.update({
          where: { id },
          data: { text, def, extra, read, language },
        });
      },
    ),
  createSFX: publicProcedure
    .input(sfxSchema)
    .mutation(
      async ({ ctx, input: { text, def, extra, read, tls, language } }) => {
        // create all TL SFX
        const tlSFX = await Promise.all(
          Object.values(tls).map(async (tl) => {
            if ("sfxID" in tl) {
              return await ctx.db.onomatopoeia.findUnique({
                where: { id: tl.sfxID },
              });
            }
            return await ctx.db.onomatopoeia.create({
              data: {
                text: tl.text,
                def: tl.def,
                extra: tl.extra,
                read: tl.read ?? null,
                language,
              },
            });
          }),
        );

        // create og SFX
        const ogSFX = await ctx.db.onomatopoeia.create({
          data: {
            text,
            def,
            extra,
            read: read ?? null,
            language,
          },
        });

        // create translations
        await Promise.all(
          tlSFX
            .filter((tlSFX) => tlSFX !== null)
            .map(async (tlSFX) => {
              await ctx.db.translation.create({
                data: { sfx1Id: ogSFX.id, sfx2Id: tlSFX.id },
              });
            }),
        );

        return ogSFX;
      },
    ),

  removeSFX: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input: { id } }) => {
      return await ctx.db.onomatopoeia.delete({
        where: { id },
      });
    }),
});
