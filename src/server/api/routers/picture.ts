import { string } from "zod/v4-mini";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { env } from "@/env";

export const pictureRouter = createTRPCRouter({
  getPicture: publicProcedure.input(string()).query(async ({ input }) => {
    if (!input) return { err: new Error("No input provided!") };

    const url = env.DB_STORAGE + input;

    console.log("Fetching:", url);

    const img = await fetch(url).then(async (res) => {
      const ctype = res.headers.get("content-type");
      console.log("type", ctype);
      if (ctype?.startsWith("image/")) {
        return Buffer.from(await res.arrayBuffer()).toString("base64");
      } else {
        const json = (await res.json()) as Record<string, string>;
        console.log("not an image", json);
        return json;
      }
    });

    return typeof img === "string" ? img : { err: img };
  }),
});
