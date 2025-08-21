import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const { NODE_ENV } = process.env;

console.log(
  "Using DB @ ",
  new URL(process.env.DATABASE_URL ?? "https://undefined").hostname,
);

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),
    CREATOR_PASSWORD: z.string(),
    DB_STORAGE: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    NEXT_PUBLIC_DEVENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXT_PUBLIC_SESSIONTOKEN: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DIRECT_URL: process.env.DIRECT_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    CREATOR_PASSWORD: process.env.CREATOR_PASSWORD,
    NODE_ENV,
    DB_STORAGE: process.env.DB_STORAGE,
    NEXT_PUBLIC_DEVENV: NODE_ENV,
    NEXT_PUBLIC_SESSIONTOKEN: process.env.NEXT_PUBLIC_SESSIONTOKEN,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
