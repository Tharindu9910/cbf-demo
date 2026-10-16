import sharp from "sharp";

/** One placeholder per source file per build, however many pages use it. */
const cache = new Map<string, Promise<string>>();

/** A 24px-wide WebP of the photo, as a data URI: the blur-up stand-in. */
export function placeholderFor(path: string) {
  let uri = cache.get(path);
  if (!uri) {
    uri = sharp(path)
      .resize(24)
      .webp({ quality: 60 })
      .toBuffer()
      .then((buffer) => `data:image/webp;base64,${buffer.toString("base64")}`);
    cache.set(path, uri);
  }
  return uri;
}
