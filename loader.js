// Docs: https://supabase.com/docs/guides/storage/image-transformations#nextjs-loader

const bucket =
  "https://tiyqziwlurzkotenqjef.supabase.co/storage/v1/render/image/public/sfx_pics/";

/**
 *
 * @param {{src: string, width:number, quality:number}} p0
 * @returns {string}
 */
export default function supabaseLoader({ src, width, quality }) {
  const url = new URL(
    src.startsWith("@") ? `${bucket + src.substring(1)}` : `${src}`,
  );
  url.searchParams.set("width", width.toString());
  url.searchParams.set("height", width.toString());
  url.searchParams.set("resize", "fill");
  url.searchParams.set("quality", (quality || 75).toString());
  return url.href;
}
