import { gsap } from "gsap";

import { whenReady } from "./imageLoading";

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

let loop: gsap.core.Timeline | null = null;

/**
 * Hold the loop while the photo layer is faded out. It is a fixed, full-screen
 * stack of scaled images: left running under the runway and the rest of the
 * page, it is re-composited every frame behind the 3D for nothing, and on a
 * phone that is enough to drop frames. `heroIntro.ts` calls this as the scroll
 * fades the layer out and back in.
 */
export function setHeroSlideshowPaused(paused: boolean) {
  loop?.paused(paused);
}

/**
 * The hero's background slideshow. Independent of the entrance choreography,
 * so the cadence never jumps when that replays or the breakpoint flips.
 */
export function runHeroSlideshow() {
  const slides = gsap.utils.toArray<HTMLElement>(".hero-bg-slide");
  if (slides.length < 2) return;

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  gsap.set(slides, { opacity: 0, xPercent: 0, scale: SLIDE_SCALE, zIndex: 0 });

  // Each slide is "ready" once loaded and decoded. The first fades in over its
  // blurred placeholder (Hero.astro) then, instead of painting in strips.
  const ready = new Set<HTMLElement>();
  slides.forEach((slide, i) =>
    whenReady(slide as HTMLImageElement).then(() => {
      ready.add(slide);
      slide.dataset.loaded = "";
      if (i === 0) gsap.to(slide, { opacity: 1, duration: still ? 0 : 0.8, ease: "power2.out" });
    }),
  );

  // A still frame for readers who ask for less motion.
  if (still) return;

  // The later slides start `hidden` so they don't download against the first
  // paint (see Hero.astro). Show them, and so start their lazy loads, halfway
  // to the first hand-over: after the headline has painted, with time to spare.
  setTimeout(
    () => slides.forEach((slide) => slide.classList.remove("hidden")),
    (SLIDE_HOLD / 2) * 1000,
  );

  const tl = (loop = gsap.timeline({ repeat: -1 }));
  const step = SLIDE_HOLD + SLIDE_FADE;

  // Every slide gets an identical step at an absolute position, so the gaps
  // stay exactly equal however many images there are.
  slides.forEach((slide, i) => {
    const next = slides[(i + 1) % slides.length];
    const start = i * step;
    const handover = start + SLIDE_HOLD;

    // Never hand over to a slide that is still downloading: a second before
    // the cross-fade, if the next one isn't ready, ease the whole loop (the
    // slow push-in included) to a stop, and ease it back once it is.
    tl.call(
      () => {
        if (ready.has(next)) return;
        gsap.to(tl, { timeScale: 0, duration: 0.6, ease: "power2.out", overwrite: true });
        void whenReady(next as HTMLImageElement).then(() =>
          gsap.to(tl, { timeScale: 1, duration: 0.6, ease: "power2.in", overwrite: true }),
        );
      },
      undefined,
      handover - 1,
    );

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
