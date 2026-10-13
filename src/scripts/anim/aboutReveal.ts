/**
 * The About page's fade-up on scroll, in Tailwind classes. Content is visible
 * by default: only `[data-reveal]` elements still below the fold when this
 * runs are hidden, then revealed as they enter, so nothing stays hidden
 * without JavaScript or under reduced motion.
 *
 * The class names are written out in full so Tailwind's scanner finds them.
 */
const MOTION = ["transition-[opacity,translate]", "duration-700", "ease-[cubic-bezier(0.22,1,0.36,1)]"];
const HIDDEN = ["opacity-0", "translate-y-7"];

export function revealOnScroll() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  const fold = innerHeight * 0.92;
  const pending = [...document.querySelectorAll<HTMLElement>("[data-reveal]")].filter(
    (el) => el.getBoundingClientRect().top > fold,
  );

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove(...HIDDEN);
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );

  for (const el of pending) {
    el.classList.add(...MOTION, ...HIDDEN);
    io.observe(el);
  }
}
