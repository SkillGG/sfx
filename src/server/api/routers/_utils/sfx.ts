import type { CollapsedOnomatopoeia, CollapsedTL } from "@/utils/utils";
import type { PrismaClient } from "@prisma/client";

export const sfxGetTLs = async (
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
