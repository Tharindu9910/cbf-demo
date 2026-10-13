import { gsap } from "gsap";

/** Seconds a slide holds before it starts handing over. */
const SLIDE_HOLD = 5;
/** Seconds the hand-over itself takes. */
const SLIDE_FADE = 1.4;

/**
 * The slide motion. Both numbers are tied together: an image scaled to
 * `SLIDE_SCALE` overhangs the frame by half the excess on each side — 8% at
 * 1.16 — and `SLIDE_SHIFT` is how far it travels as a percentage of its own
 * width. Keep the shift under that overhang or the pan drags the image's edge
 * into frame and shows a bare strip.
 */
const SLIDE_SCALE = 1.16;
const SLIDE_SHIFT = 6;
/**
 * The slow push-in under the whole of a slide's time on screen. Zooming *in*
 * only — it widens the overhang above, so it can never uncover an edge.
 */
const SLIDE_ZOOM = 1.24;

/**
 * The hero's background slideshow. Independent of the entrance choreography,
 * so the cadence never jumps when that replays or the breakpoint flips.
 */
export function runHeroSlideshow() {
  const slides = gsap.utils.toArray<HTMLElement>(".hero-bg-slide");
  if (slides.length < 2) return;

  gsap.set(slides, { opacity: 0, xPercent: 0, scale: SLIDE_SCALE, zIndex: 0 });
  gsap.set(slides[0], { opacity: 1 });

  // A still frame for readers who ask for less motion.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const tl = gsap.timeline({ repeat: -1 });
  const step = SLIDE_HOLD + SLIDE_FADE;

  // Every slide gets an identical step at an absolute position, so the gaps
  // stay exactly equal however many images there are.
  slides.forEach((slide, i) => {
    const next = slides[(i + 1) % slides.length];
    const start = i * step;
    const handover = start + SLIDE_HOLD;

    // The push-in. `fromTo` so each cycle starts from a known scale, and
    // `immediateRender: false` so building the timeline doesn't blank the
    // first slide before it runs.
    tl.fromTo(
      slide,
      { scale: SLIDE_SCALE },
      { scale: SLIDE_ZOOM, duration: step, ease: "none", immediateRender: false },
      start,
    );

    // The hand-over: the incoming slide is lifted above the outgoing one and
    // pans in over it. Its scale is rewound here because it is *seen* one fade
    // before its own step begins.
    tl.set(next, { zIndex: 1, scale: SLIDE_SCALE }, handover)
      .fromTo(
        next,
        { opacity: 0, xPercent: SLIDE_SHIFT },
        {
          opacity: 1,
          xPercent: 0,
          duration: SLIDE_FADE,
          ease: "power2.out",
          immediateRender: false,
        },
        handover,
      )
      // The outgoing slide drifts the other way over the same beat, so the cut
      // reads as a pan rather than a dissolve.
      .to(
        slide,
        { xPercent: -SLIDE_SHIFT, duration: SLIDE_FADE, ease: "power2.inOut" },
        handover,
      )
      // Reset behind the now-covered slide, leaving the stack exactly as the
      // step found it — which is what lets `repeat: -1` loop seamlessly.
      .set(slide, { opacity: 0, xPercent: 0 }, handover + SLIDE_FADE)
      .set(next, { zIndex: 0 }, handover + SLIDE_FADE);
  });
}
