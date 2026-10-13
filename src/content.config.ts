import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * The product range: the three flavours and the Mixed Pack. Name, colour,
 * corner artwork, pack facts and the product pages' copy are one entry apiece
 * so they can't fall out of step.
 *
 * `key` picks the wrap texture on the 3D can (the artwork behind each key
 * lives in `scripts/three/sodaCan.ts`). Only flavours have one; packs
 * (`kind: "pack"`) stay out of the home carousel and the 3D scenes.
 */
const flavours = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/flavours" }),
  schema: ({ image }) =>
    z.object({
      order: z.number().int(),
      kind: z.enum(["flavour", "pack"]).default("flavour"),
      brand: z.string().default("Thynkers Lyquid"),
      name: z.string(),
      key: z.enum(["blackCherry", "grape", "lemonLime"]).optional(),
      /** The flavour's accent colour. */
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      background: z.object({ left: image(), right: image() }).optional(),
      /** One factual sentence, for meta descriptions and the JSON-LD. */
      description: z.string(),
      facts: z.object({
        extract: z.string(),
        volume: z.string(),
        shelfLife: z.string(),
      }),

      /* ---- The product pages ---- */

      /** The flavour's line from the company profile, e.g. "Bold in Taste. Made to Inspire." */
      tagline: z.string(),
      /** Three words for the card and the info panel. */
      tags: z.array(z.string()).max(3),
      /** The card's size line: "250 ml", "6 × 250 ml". */
      size: z.string(),
      /** Two lines under the name in the info panel. */
      summary: z.string(),
      /** The full flavour copy, one string per paragraph. */
      story: z.array(z.string()).min(1),
      /** The sign-off under the story: "Powered by gotu kola. Finished with …". */
      finish: z.string().optional(),
      /** The ingredient line from the label. TODO for all but Matcha; hidden while empty. */
      ingredients: z.string().optional(),
      /** This product's own nutrition panel; without one the range's shared panel is used. */
      nutrition: z
        .array(
          z.object({
            name: z.string(),
            per100: z.string(),
            perServing: z.string(),
            sub: z.boolean().optional(),
          }),
        )
        .optional(),
      /** The card's and the gallery's lead picture, then the rest of the gallery. */
      gallery: z
        .array(
          z.object({
            src: image(),
            alt: z.string(),
            /** `contain`: a cut-out shot, set on the halo. `cover`: a photo that fills the frame. */
            fit: z.enum(["contain", "cover"]).default("contain"),
            /** Where a `cover` photo is framed. */
            focus: z.enum(["center", "right"]).default("center"),
          }),
        )
        .min(1),
      /** Swapped in on the card's hover, when there is one (e.g. the can with fruit). */
      hoverImage: image().optional(),
      /** The cut-out can the listing card stands in front of its fruit. Flavours only. */
      can: image().optional(),
      /** The listing's filter group, and the card's eyebrow. */
      category: z.enum(["fruit", "tea", "bundle"]),
      /**
       * The pack sizes on offer. The info panel offers a choice when there is
       * more than one; a pack with no confirmed can count is left out.
       */
      packs: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            detail: z.string().optional(),
            /** false: shown, but can’t be ordered (single cans are sold in stores only). Left out, it can be. */
            orderable: z.boolean().optional(),
          }),
        )
        .min(1),
      /** A pack the buyer fills: how many cans in all, mixed as they like from these flavours. */
      mix: z
        .object({
          cans: z.number().int().positive(),
          flavours: z.array(reference("flavours")).min(1),
        })
        .optional(),
    }),
});

/**
 * Customer quotes for the Reviews section. `placeholder` marks sample copy:
 * it must never reach structured data, and every entry should be swapped for
 * a real, consented quote before launch.
 */
const reviews = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/reviews" }),
  schema: ({ image }) =>
    z.object({
      order: z.number().int(),
      name: z.string(),
      city: z.string(),
      rating: z.number().int().min(1).max(5),
      quote: z.string(),
      flavour: reference("flavours"),
      /** The large photo tile; exactly one entry should set it. */
      featured: z.boolean().default(false),
      image: image().optional(),
      placeholder: z.boolean().default(false),
    }),
});

/**
 * The "Caught Mid-Sip" wall on the home page: customers' own videos, photos
 * and comments, in the wall's order. Videos and photos carry a still
 * (`image`); a video plays in place once its clip (`video`, a path under
 * `public/` or a full URL) is added, and links out to `href` until then.
 * `placeholder` marks sample copy, as in `reviews`.
 */
const reactions = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/reactions" }),
  schema: ({ image }) =>
    z.discriminatedUnion("kind", [
      z.object({
        kind: z.literal("video"),
        order: z.number().int(),
        handle: z.string(),
        flavour: reference("flavours"),
        image: image(),
        alt: z.string(),
        /** Where the still is framed: `top` keeps faces in a landscape crop. */
        focus: z.enum(["center", "top", "bottom"]).default("center"),
        /** "0:32". */
        duration: z.string().optional(),
        video: z.string().optional(),
        href: z.url().optional(),
        placeholder: z.boolean().default(false),
      }),
      z.object({
        kind: z.literal("photo"),
        order: z.number().int(),
        handle: z.string(),
        flavour: reference("flavours"),
        image: image(),
        alt: z.string(),
        focus: z.enum(["center", "top", "bottom"]).default("center"),
        href: z.url().optional(),
        placeholder: z.boolean().default(false),
      }),
      z.object({
        kind: z.literal("comment"),
        order: z.number().int(),
        name: z.string(),
        handle: z.string(),
        flavour: reference("flavours"),
        quote: z.string(),
        placeholder: z.boolean().default(false),
      }),
    ]),
});

export const collections = { flavours, reviews, reactions };
