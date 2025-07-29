import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const sfxRouter = createTRPCRouter({
  listSFX: publicProcedure.query(async ({ ctx }) => {
    const sfx = await ctx.db.sfx.findMany();
    return sfx;
  }),
});
