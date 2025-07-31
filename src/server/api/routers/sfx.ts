import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const sfxNoTLSchema = z.object({
  text: z.string(),
  def: z.string(),
  extra: z.string().optional().nullable(),
  read: z.string(),
});

const sfxSchema = sfxNoTLSchema.and(
  z.object({
    tls: z.record(z.string(), sfxNoTLSchema),
  }),
);

export const sfxRouter = createTRPCRouter({
  listSFX: publicProcedure
    .input(z.object({ limit: z.number().default(100).optional() }))
    .query(async ({ ctx, input: { limit } }) => {
      const sfx = await ctx.db.sFX.findMany({
        take: limit,
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
  createSFX: publicProcedure
    .input(sfxSchema)
    .mutation(async ({ ctx, input: { text, def, extra, read, tls } }) => {
      // create all TL SFX
      const tlSFX = await Promise.all(
        Object.values(tls).map(async (tl) => {
          return await ctx.db.sFX.create({
            data: {
              text: tl.text,
              def: tl.def,
              extra: tl.extra,
              read: tl.read,
            },
          });
        }),
      );

      // create og SFX
      const ogSFX = await ctx.db.sFX.create({
        data: {
          text,
          def,
          extra,
          read,
        },
      });

      // create translations
      await Promise.all(
        tlSFX.map(async (tlSFX) => {
          await ctx.db.translation.create({
            data: { sfx1Id: ogSFX.id, sfx2Id: tlSFX.id },
          });
        }),
      );

      return ogSFX;
    }),
});
