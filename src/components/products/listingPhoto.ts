import type { ImageMetadata } from "astro";

/**
 * The Products listing's optional photos: drop `hero.jpg` (the tea hills and
 * the iced drink) or `bulk.jpg` (the stacked cartons) into
 * `src/assets/images/products-page/` and the section uses it. Until then each
 * section draws its own ground, so nothing ships as a placeholder.
 */
const photos = import.meta.glob<{ default: ImageMetadata }>(
  "../../assets/images/products-page/*.{jpg,jpeg,png,webp}",
  { eager: true },
);

export function listingPhoto(name: "hero" | "bulk"): ImageMetadata | undefined {
  const hit = Object.entries(photos).find(
    ([path]) => path.split("/").pop()?.split(".")[0] === name,
  );
  return hit?.[1].default;
}
