/**
 * A loading state for photos that arrive late. The element marked
 * `[data-skeleton]` shows the `skeleton` sheen (global.css) until its photo
 * has loaded and decoded:
 *
 *   - on a frame around the photo, the photo then fades in over the sheen;
 *   - on the `<img>` itself (a photo that is its own rounded frame), the sheen
 *     is the image's background and the photo simply covers it, since fading
 *     the image would fade its background with it.
 *
 * Only lazy images still loading when this runs are touched, so the eager
 * (above-the-fold, LCP) and cached ones paint as they always did, and without
 * script nothing changes. Mark opaque photos only: a cut-out would show the
 * sheen through its transparent parts.
 */
const FADE: KeyframeAnimationOptions = {
  duration: 450,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
};

export function skeletonImages() {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  for (const frame of document.querySelectorAll<HTMLElement>("[data-skeleton]")) {
    const img = frame instanceof HTMLImageElement ? frame : frame.querySelector("img");
    if (!img || img.loading !== "lazy" || img.complete) continue;

    const fades = img !== frame && !still;
    frame.classList.add("skeleton");
    // Held back until decoded, so a big photo never paints in strips.
    if (fades) img.style.opacity = "0";

    const reveal = () => {
      img.style.opacity = "";
      if (!fades) return frame.classList.remove("skeleton");
      img
        .animate([{ opacity: 0 }, { opacity: 1 }], FADE)
        .finished.finally(() => frame.classList.remove("skeleton"));
    };

    img.addEventListener("load", () => void img.decode().catch(() => {}).then(reveal), { once: true });
    img.addEventListener("error", reveal, { once: true });
  }
}
