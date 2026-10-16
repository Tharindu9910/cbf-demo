# CLAUDE.md

Static Astro 7 rebuild of the CBF / Thynkers Lyquid landing page (nav, hero + runway, "Choose your Flavor" carousel), ported from the Next.js + Prismic site in `../cbf`. The visual target is **pixel parity with that site**. Hosted as plain files on GoDaddy (Apache), so there is no server runtime. See README.md for commands and deployment.

## The 3D architecture

There is one WebGL canvas for the whole site (`.stage` in `layouts/Base.astro`). Sections don't create canvases. Each places a DOM box (`[data-view]`), and `scripts/three/stage.ts` scissor-renders that section's scene into the box's on-screen rectangle every frame.

This is the old R3F `<Canvas>` + drei `<View>` model, written in plain three.js. So:
- The size and scroll position of the 3D come from the CSS on the `[data-view]` box.
- The camera is fixed at fov 30, z 5. `view.viewport` is R3F's `useThree().viewport`, the world size of the frame at z 0.

The ports are deliberately literal. Their numbers come from the Next code:
- `sodaCan.ts`: UVs and label/metal split generated at runtime.
- `floatingCan.ts`: drei's `Float` formula, term for term.
- `canCluster.ts`: copied verbatim.
- `scenes/hero.ts`: a line-by-line port of `Hero/Scene.tsx`.

Don't "tidy" a constant without checking it against `../cbf`.

`scripts/bridge.ts` holds the promises that connect the page scripts to the lazily loaded 3D chunk. The hero copy waits on `heroReady`, with a 2.5s fallback so the text never stays hidden. The carousel arrows do nothing until `carouselReady`.

three.js loads lazily (see the script in `Base.astro`): straight away on desktop (wide, fine pointer, landscape), and elsewhere once the page has loaded and the main thread is idle.

The hero cans run on every screen, in one of two choreographies picked from the view box's shape (`scenes/hero.ts`):
- **Landscape:** the ported desktop choreography. Its numbers are untouched.
- **Portrait:** the group stands in `[data-can-slot="top"]` above the headline. It is drawn shifted with the page (`view.offsetY`) until that slot leaves the screen. It then rises into `[data-can-slot="end"]` under the runway copy, landing as the sticky box lets go. `cans-trio.png` holds the top slot until the first 3D frame sets `data-hero-3d` on `.hero`.

The render loop runs only while a `[data-view]` box is on screen (IntersectionObserver in `stage.ts`). Touch screens get a higher DPR cap (2 vs 1.5), and MSAA is on everywhere.

Mobile conventions: `short:` is a custom variant (landscape and at most 500px tall) for phones on their side. Desktop at `lg` and up stays pixel-identical, so phone-only sizes are written base-first with the original value restored at `lg:`. Phones get the header menu `<dialog>`.

## Styling: Tailwind only

Every component is styled with Tailwind classes. Don't add `<style>` blocks, CSS files or BEM classes. Shared pieces live in one place each:

- **`src/styles/global.css`** holds the tokens: every colour (`brand-*`, `ink-*`, and section groups `gk-*`, `claims-*`, `footer-*`), font (`font-inter`, `font-display`, `font-figtree`…), shadow and easing. It also holds the custom utilities and variants: `frame-*`, `scrollbar-none`, `animate-scroll-drift`, `noscript:`. A new colour goes here as a named token. Don't put a raw hex in markup.
- **`src/styles/section.ts`** holds class recipes shared by sections (`eyebrow`, `heading`, `body`). Only use one where it fits exactly, because a second class for the same property doesn't reliably override it.
- **`src/components/ui/PillLink.astro`** is the moss CTA pill. Sizing comes from `class`.
- **Design-frame sections** (CompanyIntro, GotuKola, Reviews, OrderNow, Footer) set `lg:frame-<mockup width>` (Footer: `xl:`) and size everything as `calc(<px>*var(--u))`, with a `max(<floor>px,…)` on text. Write font sizes as `text-[length:…]` so Tailwind doesn't read them as colours.
- **Scroll reveals:** put `data-reveal` on a copy block (eyebrow, heading, copy and CTA as its children) or on a card. `scripts/anim/reveal.ts` (run by `Base.astro` on every page) plays each one once as it enters. A block with a heading plays its children in order and the heading's lines rise out of a SplitText mask, which is reverted afterwards. Anything else rises as one. It never hides content above the fold, without script, or under reduced motion. Don't mark elements whose transform or opacity GSAP already owns (the hero, `.brand-intro`, the reactions tiles).
- **Loading sheen:** mark an opaque, lazy photo with `data-skeleton`, on its frame (the photo fades in over the sheen) or on the `<img>` itself when it is its own frame. `scripts/anim/imageLoading.ts` adds and removes the `skeleton` utility. Never on cut-outs (the sheen shows through) or on background photos behind copy.
- Tailwind only sees class names written out in full. `` `${prefix}:opacity-0` `` won't generate anything.
- Tailwind's `scale-*`/`translate-*` set the separate `scale`/`translate` properties. Where script writes `style.transform` (the WebGL loader bar), use `transform-[…]`.

## Rules that are easy to break

- **No inline `style=""` in markup.** The page ships a hash-based CSP via Astro's `security.csp`, and inline style attributes are blocked. Put initial states in classes (`opacity-0`, plus a `noscript:` fallback where script would undo it). Styles set from script (GSAP, three) are fine.
- **Tailwind v4 line-heights.** v3's responsive `text-*` reset line-height; v4's `leading-*` always wins. Where the design relied on the v3 behaviour, the markup states the line-height explicitly (e.g. `lg:leading-7`). Keep those.
- **Arbitrary values need underscores** in v4 (`grid-rows-[auto_4fr_auto]`). Use `outline-hidden`, not `outline-none`, to match v3's `outline-none`.
- **Font weights in `astro.config.mjs`** mirror what `next/font` produced:
  - Aonic is registered at 400, so the headline's `font-black` is synthetic bold.
  - Saira is registered at `100 900` (variable).
  Changing either changes the look.
- **The `G` in "BeveraGes"** sits in its own inline-block span. It breaks the kerning and sets the headline width. Keep it.
- `.hero` has `overflow-x-clip`. `hidden` would break the sticky 3D layer. The clip stops the 3x-scaled headline entrance from zooming phones out.
- GSAP owns `transform`/`opacity` on `.hero-bg-slide`, `.flavor-piece`, `.hero-header-word` etc. Don't add Tailwind transform classes to them.

## Content and SEO

- Copy, nav, organisation data and SEO defaults are in `src/config/site.ts`.
- The flavours are a content collection (`src/content/flavours/*.json`), and `JsonLd.astro` builds the Product structured data from the same entries.
- Placeholders (marked TODO) are dropped from the JSON-LD while they're empty.
- The About page (`/about/`) takes its copy from `src/config/about.ts`. Empty values hide what depends on them (stats, certifications, the founder section, step photos), so placeholders never ship. Its components in `components/about/` use Tailwind utilities only, with no `<style>` blocks.
- The Contact page (`/contact/`) takes its copy from `src/config/contact.ts`, with the same empty-hides rule (reply time, hours, WhatsApp, carton pack, FAQ line). Its form posts to `public/contact.php`, the site's only server-side code (GoDaddy PHP: recipients and sender are set at the top of that file). `inquiryHref` in `site.ts` builds every link into it; `scripts/contact/form.ts` pre-fills the form from those links' query string. There's no PHP in `astro dev`/`preview`, so sending can only be tested on the host.
- Stockists are one list, `RETAILERS` in `src/config/products.ts` (logos in `src/assets/images/stores/`, initials stand in without one). It feeds the Contact page's full "Where to Buy" (`#where-to-buy`), the products listing strip, each product page's "Available at" and a row in the home "Order Now"; all hide while it's empty. Add real stockists only, never placeholder entries.
- `public/products/*.jpg`, `public/og/home.jpg` and `src/assets/images/cans-trio.png` were rendered from the 3D scene. The original site's mobile cans image was a Fizzi-starter leftover, not this brand.
