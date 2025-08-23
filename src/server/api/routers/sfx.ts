import { object, string, number, array } from "zod/v4";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { CollapsedOnomatopoeia, CollapsedTL, SearchOptions } from "@/utils";
import { checkSession } from "./user";
import { searchDBForSFX } from "./_utils/search";
import { sfxGetTLs } from "./_utils/sfx";

const authShape = object({ token: string(), deviceName: string() });

const DEFAULT_LIMIT = 100;
const DEFAULT_SKIP = 0;

export const sfxRouter = createTRPCRouter({
  listSFX: publicProcedure
    .input(SearchOptions.optional())
    .query(async ({ ctx, input }): Promise<CollapsedOnomatopoeia[]> => {
      const search = typeof input === "object" && input ? input : null;

      if (
        search &&
        (!!search.query ||
          (search.langs?.length ?? 0) > 0 ||
          Number(search.id) > 0)
      )
        return await searchDBForSFX(ctx.db, {
          langs: search.langs ?? [],
          limit: search.limit ?? DEFAULT_LIMIT,
          skip: search.skip ?? DEFAULT_SKIP,
          order: search.order ?? "asc",
          query: search.query ?? "",
          id: search.id ?? 0,
        });

      console.log("List searchh", search);

      const sfxs = await ctx.db.onomatopoeia.findMany({
        orderBy: { id: "asc" },
        select: {
          def: true,
          extra: true,
          id: true,
          language: true,
          read: true,
          text: true,
          updatedAt: true,
        },
      });

      if (input === "list") return sfxs.map((q) => ({ ...q, tls: [] }));

      const reverse = search?.order === "desc";

      const ret = await sfxGetTLs(ctx.db, sfxs, reverse);

      const limit = search?.limit ?? DEFAULT_LIMIT;
      const skip = search?.skip ?? DEFAULT_SKIP;

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
