/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      new URL("https://picsum.dev/**"),
      new URL("https://picsum.photos/**"),
    ],
    loader: "default",
  },
  experimental: {
    reactCompiler: {
      compilationMode: "infer",
    },
  },
};

export default config;
