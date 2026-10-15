import { gsap } from "gsap";

import { carouselReady, type CarouselStage } from "../bridge";

const SPINS_ON_CHANGE = 8;

/** How far off-screen a parked corner piece sits, as a % of its own width. */
const OFFSCREEN = 115;

/** A horizontal swipe this long (px), and more sideways than down, changes flavour. */
const SWIPE = 40;

type FlavourData = { key: string; name: string; extract: string };

/**
 * "Choose your Flavor". On a change the outgoing corner pieces break apart to
 * their own edges while the incoming pair slides in to meet in the middle, the
 * can spins eight times, and the name swaps halfway through the spin.
 */
export function runCarousel() {
  const section = document.querySelector<HTMLElement>(".carousel");
  if (!section) return;

  const flavours: FlavourData[] = JSON.parse(section.dataset.flavours ?? "[]");
  const left = flavours.map((_, i) =>
    section.querySelector<HTMLElement>(`.flavor-piece[data-side="left"][data-index="${i}"]`),
  );
  const right = flavours.map((_, i) =>
    section.querySelector<HTMLElement>(`.flavor-piece[data-side="right"][data-index="${i}"]`),
  );
  const nameEl = section.querySelector<HTMLElement>("[data-flavor-name]");
  const extractEls = section.querySelectorAll<HTMLElement>("[data-flavor-extract]");

  let current = 0;
  let stage: CarouselStage | null = null;
  // The can may arrive after the reader has already changed flavour (phones
  // load the 3D late): bring it up to date.
  carouselReady.promise.then((s) => {
    stage = s;
    stage.setFlavor(flavours[current].key);
  });

  // Park every inactive pair off-screen. They start transparent (an
  // `opacity-0` class in FlavourCarousel.astro) so the markup doesn't stack all three pairs before this runs.
  flavours.forEach((_, i) => {
    if (i === 0) return;
    gsap.set(left[i], { xPercent: -OFFSCREEN, opacity: 1 });
    gsap.set(right[i], { xPercent: OFFSCREEN, opacity: 1 });
  });

  const show = (index: number) => {
    current = index;
    const flavour = flavours[index];
    if (nameEl) nameEl.textContent = flavour.name;
    extractEls.forEach((el) => (el.textContent = flavour.extract));
    stage?.setFlavor(flavour.key);
  };

  let changing: gsap.core.Timeline | null = null;

  const changeFlavor = (index: number) => {
    // One change at a time: a second tap mid-spin would double the spin.
    if (changing?.isActive()) return;

    const nextIndex = (index + flavours.length) % flavours.length;
    const tl = (changing = gsap.timeline());

    flavours.forEach((_, i) => {
      const active = i === nextIndex;
      tl.to(
        left[i],
        { xPercent: active ? 0 : -OFFSCREEN, ease: "power3.inOut", duration: 1 },
        0,
      ).to(
        right[i],
        { xPercent: active ? 0 : OFFSCREEN, ease: "power3.inOut", duration: 1 },
        0,
      );
    });

    // Until the can is on stage the backdrop and copy change without it; it
    // picks the flavour up when it arrives.
    if (stage) {
      const turns = Math.PI * 2 * SPINS_ON_CHANGE;
      tl.to(
        stage.spinTarget.rotation,
        {
          y: index > current ? `-=${turns}` : `+=${turns}`,
          ease: "power2.inOut",
          duration: 1,
        },
        0,
      );
    }

    // The name and the per-product bits of the facts panel swap together.
    tl.to(".text-wrapper, .flavor-swap", { duration: 0.2, y: -10, opacity: 0 }, 0)
      .to({}, { onStart: () => show(nextIndex) }, 0.5)
      .to(".text-wrapper, .flavor-swap", { duration: 0.2, y: 0, opacity: 1 }, 0.7);
  };

  // The arrows are wired as they were in the Next build: the left one steps
  // forward through the range and the right one back.
  section
    .querySelector("[data-flavor-prev]")
    ?.addEventListener("click", () => changeFlavor(current + 1));
  section
    .querySelector("[data-flavor-next]")
    ?.addEventListener("click", () => changeFlavor(current - 1));

  // Swipe, anywhere on the section: like the arrows, a swipe to the left
  // brings in the next flavour. The section is `touch-pan-y`, so vertical
  // drags still scroll the page and only sideways ones arrive here.
  let start: { x: number; y: number; id: number } | null = null;
  section.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    start = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });
  section.addEventListener("pointercancel", () => (start = null));
  section.addEventListener("pointerup", (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    changeFlavor(dx < 0 ? current + 1 : current - 1);
  });
}
