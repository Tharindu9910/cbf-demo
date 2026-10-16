// @ts-check
import { readdir, readFile, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";

/**
 * The production origin. Canonical URLs, the sitemap, Open Graph and the
 * JSON-LD all hang off this one value, so a wrong one here is an SEO bug on
 * every page — set `SITE_URL` in `.env` before a production build.
 */
const { SITE_URL = "https://www.ceylonfuturebeverages.com", BASE_PATH = "/" } = loadEnv(
  process.env.NODE_ENV ?? "production",
  process.cwd(),
  "",
);

/**
 * Astro copies every imported image's full-size original into `_astro/`, even
 * when the pages only ever use its resized WebP variants. Nothing links to
 * those originals (some are 1–3 MB), so they only bloat the upload. After the
 * build, delete any image in `_astro/` that no page, script, stylesheet or
 * sitemap names.
 *
 * @returns {import("astro").AstroIntegration}
 */
function pruneUnusedImages() {
  return {
    name: "prune-unused-images",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = (await readdir(root, { recursive: true })).map((f) => join(root, f));
        let text = "";
        for (const f of files) {
          if (/\.(html|js|css|xml|json|webmanifest|txt)$/.test(f)) text += await readFile(f, "utf8");
        }
        let count = 0;
        let bytes = 0;
        for (const f of files) {
          const name = f.split("/").pop() ?? "";
          if (!f.includes("/_astro/") || !/\.(jpe?g|png|webp|avif|gif)$/i.test(name)) continue;
          if (text.includes(name)) continue;
          bytes += (await stat(f)).size;
          await unlink(f);
          count++;
        }
        logger.info(`removed ${count} unreferenced images (${(bytes / 1048576).toFixed(1)} MB)`);
      },
    },
  };
}

export default defineConfig({
  site: SITE_URL,
  // "/" in production. The GitHub Pages demo builds with BASE_PATH=/cbf-demo
  // (see .github/workflows/deploy.yml); root-absolute paths go through
  // `url()` in src/config/url.ts so they follow it.
  base: BASE_PATH,
  output: "static",
  // GoDaddy serves this over Apache, which answers `/about` with a redirect to
  // `/about/` (DirectorySlash). Emitting directories and always linking with
  // the slash means every canonical URL is the one Apache serves without a hop.
  trailingSlash: "always",
  build: {
    format: "directory",
    // ~7 kB gzipped: cheaper inline than as a render-blocking request. The CSP
    // below hashes it like any other inline style.
    inlineStylesheets: "always",
  },
  compressHTML: true,
  // No Markdown code blocks on this site, and Shiki's inline styles can't
  // pass the CSP below.
  markdown: { syntaxHighlight: false },

  // The form's no-script thank-you page is noindex, so it stays out of the sitemap.
  integrations: [
    sitemap({ filter: (page) => !page.endsWith("/contact/thanks/") }),
    pruneUnusedImages(),
  ],

  image: {
    responsiveStyles: false,
    // Every image the pages use is built as WebP. The masters in src/assets
    // stay JPG/PNG on purpose: sharp shrinks a WebP source through a faster,
    // lossier path, so WebP masters build measurably softer. Same quality as
    // sharp's default, smaller files: its slowest, best effort.
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        webp: { effort: 6 },
      },
    },
  },

  fonts: [
    {
      provider: fontProviders.local(),
      name: "Alpino",
      cssVariable: "--ff-alpino",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/Alpino-Variable.woff2"],
            weight: "100 900",
            style: "normal",
            display: "swap",
          },
        ],
      },
    },
    // Weights mirror what the Next build's `next/font/local` produced, which
    // registered both of these without a weight. Aonic is a static face, so
    // that meant 400 and `font-black` on the headline renders as the
    // browser's synthetic bold — declaring its real weight would change the
    // look. Saira is variable, so it got its full axis and `font-semibold`
    // uses the real 600 instance. Its file has the weight axis only: the
    // width axis was pinned to its default (100) with fontTools' instancer,
    // as nothing sets `font-stretch` — same glyphs, 109 kB down to 36 kB.
    {
      provider: fontProviders.local(),
      name: "Aonic",
      cssVariable: "--ff-aonic",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/aonic-medium.woff2"],
            weight: "400",
            style: "normal",
            display: "swap",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Saira",
      cssVariable: "--ff-saira",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/Ubuntu-Saira.woff2"],
            weight: "100 900",
            style: "normal",
            display: "swap",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Playfair Display",
      cssVariable: "--ff-playfair",
      fallbacks: ["Georgia", "serif"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/PlayfairDisplay-Variable.woff2"],
            weight: "400 900",
            style: "normal",
            display: "swap",
          },
        ],
      },
    },
    // The Gotu Kola section's faces, as its mockup specified them. Fraunces
    // carries the optical-size axis the headings set with `opsz`.
    {
      provider: fontProviders.local(),
      name: "Fraunces",
      cssVariable: "--ff-fraunces",
      fallbacks: ["Georgia", "serif"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/Fraunces-Variable.woff2"],
            weight: "100 900",
            style: "normal",
            display: "swap",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Outfit",
      cssVariable: "--ff-outfit",
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/Outfit-Variable.woff2"],
            weight: "100 900",
            style: "normal",
            display: "swap",
          },
        ],
      },
    },
    // The Ceylon Future Beverages section's body face.
    {
      provider: fontProviders.local(),
      name: "Inter",
      cssVariable: "--ff-inter",
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/Inter-Variable.woff2"],
            weight: "100 900",
            style: "normal",
            display: "swap",
          },
        ],
      },
    },
    // The footer's face.
    {
      provider: fontProviders.local(),
      name: "Poppins",
      cssVariable: "--ff-poppins",
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/Poppins-300.woff2"],
            weight: 300,
            style: "normal",
            display: "swap",
          },
          {
            src: ["./src/assets/fonts/Poppins-400.woff2"],
            weight: 400,
            style: "normal",
            display: "swap",
          },
          {
            src: ["./src/assets/fonts/Poppins-500.woff2"],
            weight: 500,
            style: "normal",
            display: "swap",
          },
          {
            src: ["./src/assets/fonts/Poppins-600.woff2"],
            weight: 600,
            style: "normal",
            display: "swap",
          },
        ],
      },
    },
  ],

  security: {
    // Emits a <meta> CSP with hashes for every script and style Astro bundles.
    // Header-only directives (frame-ancestors) are sent from `.htaccess`.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self' blob: data:",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ],
    },
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      // three.js is one ~170 kB (gzip) chunk by design: it is imported lazily
      // after first paint (see layouts/Base.astro), so it never blocks render.
      chunkSizeWarningLimit: 800,
    },
  },
});
