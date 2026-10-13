# Ceylon Future Beverages — Astro site

A static rebuild of the CBF / Thynkers Lyquid landing page: the nav bar, the hero (including its scroll "runway"), and the "Choose your Flavor" carousel. It is ported from the Next.js + Prismic site in `../cbf` and looks and moves the same, but has no CMS, no React, and nothing to run on the server.

**Stack:**
- Astro 7, static output
- Tailwind CSS 4
- GSAP 3.15 with ScrollTrigger
- three.js r186, plain three.js with no R3F or drei

## Commands

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # astro check + static build into dist/
npm run preview   # serve dist/ locally
```

Set the production origin before a real build. Canonical URLs, the sitemap, Open Graph tags and the JSON-LD all depend on it:

```bash
cp .env.example .env    # then edit SITE_URL
```

## Deploying to GoDaddy (cPanel)

1. Turn on the free SSL certificate for the domain in cPanel. Do this first, because `.htaccess` sends HSTS and forces HTTPS.
2. Run `npm run build`.
3. Upload the contents of `dist/` into `public_html/`, using cPanel's File Manager or SFTP. The dotfiles `.htaccess` and `.well-known/` must be uploaded too; some FTP clients hide them.
4. Check the live site:
   - `curl -I http://yourdomain` returns a 301 to `https://www.yourdomain/`.
   - Run the site through securityheaders.com and Google's Rich Results Test.
   - Submit `https://www.yourdomain/sitemap-index.xml` in Google Search Console and Bing Webmaster Tools.

By default `.htaccess` sends every request to `https://www.<domain>`. If the site should live on the bare domain instead, swap the two host rules in `public/.htaccess` and set `SITE_URL` to match.

## Where things live

| What | Where |
|---|---|
| Brand copy, nav links, SEO defaults, organisation data | `src/config/site.ts` |
| The range: three flavours and the Mixed Pack (name, colour, art, facts, product-page copy, gallery, packs) | `src/content/flavours/*.json` |
| Products pages (`/products/`, `/products/<id>/`) | `src/pages/products/`, `src/components/products/` |
| Range-wide product copy: nutrition, benefits, FAQs, retailers, listing hero | `src/config/products.ts` |
| Enquiry links (switch to the Contact page via `CONTACT_HREF`), `FAQ_HREF` | `src/config/site.ts` |
| Page sections | `src/components/Header.astro`, `Hero.astro`, `FlavourCarousel.astro` |
| `<head>` SEO and JSON-LD | `src/components/seo/` |
| Shared WebGL canvas and views | `src/scripts/three/stage.ts` |
| Can model, label wrap, floating motion | `src/scripts/three/sodaCan.ts`, `floatingCan.ts` |
| 3D scenes | `src/scripts/scenes/hero.ts`, `carousel.ts` |
| DOM animations | `src/scripts/anim/` |
| Apache headers, redirects, caching | `public/.htaccess` |

## Still to fill in

These are placeholders. Empty values are left out of the structured data rather than guessed.

- `SITE_URL`: the real domain.
- `src/config/site.ts`:
  - social profile URLs (`sameAs`)
  - contact email and phone
  - street address
  - Search Console and Bing verification tokens
- Product prices. Once they are known, add `offers` to the Products in `src/components/seo/JsonLd.astro`. Google won't show product rich results without a price or reviews.
- "About Us", "FAQs" and "Contact" in the nav point at sections on this page until those pages exist.
