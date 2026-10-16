/**
 * How images arrive, on every page. Until an image has loaded and decoded it
 * stays transparent (the `img:not([data-loaded])` rule in global.css, in
 * place before first paint), then it fades in to its own opacity. So nothing
 * snaps from blank to photo, and a large photo never paints in strips.
 *
 * Underneath, while it loads, there is one of:
 *   - a frame marked `[data-skeleton]`: it shows the `skeleton` sheen until
 *     the photo is in;
 *   - a `BlurPlaceholder` (the page heroes): a blurred copy, inlined in the
 *     HTML, that the sharp photo fades in over;
 *   - otherwise the section's own ground (cut-outs, logos, inline photos).
 *
 * The hero slides are the slideshow's (`heroSlideshow.ts`), which waits for
 * each one the same way. Reduced motion skips the fade, not the wait.
 */
const FADE: KeyframeAnimationOptions = {
  duration: 500,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
};

export function smoothImages() {
  // The script is here: global.css's no-script failsafe stands down.
  document.documentElement.dataset.images = "";
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const show = (img: HTMLImageElement, frame: HTMLElement | null) => {
    if ("loaded" in img.dataset) return;
    img.dataset.loaded = "";
    if (still) return frame?.classList.remove("skeleton");
    // Fade to the opacity its classes give it (the footer's 55% leaves).
    const to = getComputedStyle(img).opacity;
    img
      .animate({ opacity: ["0", to] }, FADE)
      .finished.finally(() => frame?.classList.remove("skeleton"));
  };

  for (const img of document.images) {
    if (img.matches("[data-placeholder], .hero-bg-slide")) continue;
    const frame = img.closest<HTMLElement>("[data-skeleton]");
    if (!img.complete) frame?.classList.add("skeleton");
    void whenReady(img).then(() => show(img, frame));
  }
}

/** Resolves once an image is loaded and decoded, or has failed: ready to paint whole. */
export function whenReady(img: HTMLImageElement): Promise<void> {
  const decode = () => img.decode().catch(() => {});
  if (img.complete) return decode();
  return new Promise((resolve) => {
    img.addEventListener("load", () => void decode().then(resolve), { once: true });
    img.addEventListener("error", () => resolve(), { once: true });
  });
}
