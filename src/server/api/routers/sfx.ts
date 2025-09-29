import { object, string, number, array } from "zod/v4";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  CollapsedOnomatopoeia,
  CollapsedTL,
  SearchOptions,
} from "@/utils/utils";
import { checkSession } from "./user";
import { searchDBForSFX } from "./_utils/search";
import { sfxGetTLs } from "./_utils/sfx";
import { Parser } from "@/utils/parse/sfxParse";

const authShape = object({ token: string(), deviceName: string() });

const DEFAULT_LIMIT = 100;
const DEFAULT_SKIP = 0;

const properID = (n: number | string, failedValue = 0) =>
  ((n: number) => {
    return isFinite(n) && n > 0;
  })(Number(n))
    ? Number(n)
    : failedValue;

const flattenTLs: (t: CollapsedTL[]) => CollapsedTL[] = (tls) => {
  return tls
    .map<CollapsedTL[]>((tl) => {
      if (!tl.sfx.tls || tl.sfx.tls.length === 0) return [tl];
      return [tl, ...flattenTLs(tl.sfx.tls)];
    })
    .flat(100);
};

export const sfxRouter = createTRPCRouter({
  listLangs: publicProcedure.query(async ({ ctx }) => {
    const langs = await ctx.db.language.findMany({});
    console.log("FOUND LANGS", langs);
    return langs;
  }),
  addLang: publicProcedure
    .input(object({ id: string(), name: string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.language.upsert({
        where: { id: input.id },
        create: { ...input },
        update: { name: input.name },
      });
      return true;
    }),
  removeLang: publicProcedure
    .input(string())
    .mutation(async ({ ctx, input: id }) => {
      await ctx.db.language.delete({ where: { id } });
    }),
  listSFX: publicProcedure
    .input(SearchOptions.optional())
    .query(async ({ ctx, input }): Promise<CollapsedOnomatopoeia[]> => {
      const search = typeof input === "object" && input ? input : null;

      if (searchIsValid(search))
        return await searchDBForSFX(ctx.db, {
          langs: search?.langs ?? [],
          limit: search?.limit ?? DEFAULT_LIMIT,
          skip: search?.skip ?? DEFAULT_SKIP,
          order: search?.order ?? "asc",
          query: search?.query ?? "",
          id: search?.id ?? 0,
          ids: search?.ids ?? [],
          nodedupe: search?.nodedupe ?? false,
          featured: search?.featured ?? false,
        });

      console.log("List search", search);

      const sfxs = (
        await ctx.db.onomatopoeia.findMany({
          where: search?.featured ? { featured: search.featured } : undefined,
          orderBy: { id: "asc" },
          select: {
            def: true,
            extra: true,
            id: true,
            info: true,
            languageId: true,
            read: true,
            text: true,
            featured: true,
            updatedAt: true,
          },
        })
      ).map((sfx) => ({ ...sfx, language: sfx.languageId }));

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
          sfx: { text, def, extra, read, language, tls, featured },
        },
      }) => {
        const allTLs = flattenTLs(tls);

        const loggedIn = await checkSession(ctx.db, { token, deviceName });
        if (!loggedIn.ok) return loggedIn;

        const sfxUpdates = [
          { text, def, extra, read, language, id, featured },
          ...allTLs.filter((s) => properID(s.sfx.id)).map((q) => q.sfx),
        ];

        // update every SFX
        await Promise.all(
          sfxUpdates.map(async (sfx) => {
            if (properID(sfx.id))
              return await ctx.db.onomatopoeia.update({
                where: { id: sfx.id },
                data: {
                  def: sfx.def,
                  extra: sfx.extra,
                  languageId: sfx.language,
                  featured: sfx.featured,
                  read: sfx.read,
                  text: sfx.text,
                  searchread: Parser.strip(sfx.read),
                  searchextra: Parser.strip(sfx.extra),
                  searchdef: Parser.strip(sfx.def),
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

          const hasgoodIds = properID(tl.id) && properID(tl.sfx2Id);

          if (!hasgoodIds) {
            const id = properID(tl.sfx.id, -1);
            await ctx.db.onomatopoeia.upsert({
              where: { id },
              create: {
                def: tl.sfx.def,
                read: tl.sfx.read,
                text: tl.sfx.text,
                languageId: tl.sfx.language,
                extra: tl.sfx.extra,
                featured: tl.sfx.featured,
                searchread: Parser.strip(tl.sfx.read),
                searchextra: Parser.strip(tl.sfx.extra),
                searchdef: Parser.strip(tl.sfx.def),
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
                languageId: tl.sfx.language,
                featured: tl.sfx.featured,
                extra: tl.sfx.extra,
                searchread: Parser.strip(tl.sfx.read),
                searchextra: Parser.strip(tl.sfx.extra),
                searchdef: Parser.strip(tl.sfx.def),
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
      },
    ),

  createSFX: publicProcedure
    .input(
      CollapsedOnomatopoeia.omit({ id: true }).and(object({ auth: authShape })),
    )
    .mutation(
      async ({
        ctx,
        input: { auth, text, def, extra, read, tls, language, featured },
      }) => {
        const loggedIn = await checkSession(ctx.db, auth);
        if (!loggedIn.ok) return loggedIn;
        // create og SFX

        type CreateCreateObject = {
          def: string;
          extra: string | null;
          languageId: string;
          read: string | null;
          text: string;
          searchread: string;
          featured: boolean;
          searchdef: string;
          searchextra: string;
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
          languageId,
          read,
          text,
          featured,
          tls,
        }: Omit<
          CreateCreateObject,
          "ogTranslations" | `search${"def" | "extra" | "read"}`
        > & {
          tls: CollapsedTL[];
        }): CreateCreateObject => {
          return {
            text,
            def,
            extra,
            featured,
            read,
            languageId,
            searchdef: Parser.strip(def),
            searchread: Parser.strip(read),
            searchextra: Parser.strip(extra),
            ogTranslations: {
              create: tls.map((tl) => ({
                additionalInfo: tl.additionalInfo,
                tlSFX: {
                  connectOrCreate: {
                    where: { id: properID(tl.sfx.id) ? tl.sfx.id : -1 },
                    create: createCreateObject({
                      ...tl.sfx,
                      languageId: tl.sfx.language,
                    }),
                  },
                },
              })),
            },
          };
        };

        const createObject = createCreateObject({
          def,
          extra,
          languageId: language,
          read,
          text,
          featured,
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
function searchIsValid(
  search: SearchOptions | null,
) {
  return (
    !!search &&
    search !== "list" &&
    (!!search.query ||
      (search.langs?.length ?? 0) > 0 ||
      Number(search.id) > 0 ||
      (search.ids?.length ?? 0) > 0)
  );
}
