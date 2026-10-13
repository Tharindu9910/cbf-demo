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
