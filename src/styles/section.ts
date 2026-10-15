/**
 * Tailwind class recipes shared by the ivory and green sections' copy. Each is
 * the phone size, then the `lg` size scaled by the section's `frame-*` unit
 * (`--u`, see global.css), with a floor so text stays legible.
 *
 * Use one only where a section matches it exactly. Adding a second class for
 * the same property (say, another `lg:text-*`) doesn't override it, because
 * Tailwind orders the CSS, not the class list. A section that differs writes
 * its own classes.
 */

/** Small caps-spaced line above a heading: "ROOTED IN CEYLON…". */
export const eyebrow =
  "font-bold text-[12px] leading-[16px] tracking-[2.6px] lg:text-[length:max(11px,calc(12*var(--u)))] lg:leading-[max(15px,calc(16*var(--u)))] lg:tracking-[calc(2.6*var(--u))]";

/** Playfair section heading, phone size (each section sets its own `lg:`). */
export const heading =
  "font-display font-bold text-[length:clamp(34px,9.5vw,44px)] leading-[0.98] tracking-[-0.5px]";

/** Inter body paragraph. */
export const body =
  "text-[16px] leading-[25px] lg:text-[length:max(15px,calc(16.5*var(--u)))] lg:leading-[1.515]";

/*
 * Phone overrides (below `lg`), matching "Meet Thynkers Lyquid" (BrandIntro):
 * Outfit copy, Playfair Black headings, one eyebrow and one body size. Every
 * class is `max-lg:`, so desktop is untouched; add them next to a section's
 * own classes and they win below `lg` (variants sort after base utilities).
 *
 * The phone rhythm that goes with them: sections `py-16`, eyebrow → heading
 * 12px, heading → copy 16px, paragraphs 12px apart, copy → next block 28px,
 * → CTA 32px. CTAs are 48px pills (`h-12 px-7`, 15px).
 */

/** On the section root: the copy face. */
export const phoneFont = "max-lg:font-outfit";

/** Section eyebrow: green, caps, letterspaced. */
export const phoneEyebrow =
  "max-lg:text-[12px] max-lg:leading-4 max-lg:font-semibold max-lg:tracking-[0.2em] max-lg:text-brand-fern max-lg:uppercase";

/** Section heading: the brand name's weight, a step under its size. */
export const phoneHeading =
  "max-lg:text-[length:min(11.5vw,3.25rem)] max-lg:leading-[1.02] max-lg:font-black max-lg:tracking-[-0.02em]";

/** Body paragraph: BrandIntro's 15px. */
export const phoneBody = "max-lg:text-[15px] max-lg:leading-[1.5]";
