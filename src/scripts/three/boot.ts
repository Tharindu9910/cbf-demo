import { mountLoader } from "./loader";
import { createStage } from "./stage";
import { mountHeroScene } from "../scenes/hero";
import { mountCarouselScene } from "../scenes/carousel";
import type { Flavor } from "./sodaCan";
import { carouselReady } from "../bridge";

/**
 * Everything three.js, behind one dynamic import so none of it sits in the
 * page's critical path: the HTML, the copy and the hero photo paint first,
 * then this chunk streams in.
 */
export async function boot() {
  const host = document.querySelector<HTMLElement>("[data-stage]");
  if (!host) return;

  // drei's full-screen loader covers the desktop hero while its cans load.
  // Touch screens show a photo of the cans meanwhile, and load this chunk
  // after the page is up — a panel dropping over the page then would only
  // get in the way.
  if (matchMedia("(min-width: 768px) and (pointer: fine) and (orientation: landscape)").matches) mountLoader();
  createStage(host);

  const carouselEl = document.querySelector<HTMLElement>('[data-view="carousel"]');
  if (carouselEl) {
    const flavor = (carouselEl.dataset.flavor ?? "blackCherry") as Flavor;
    mountCarouselScene(carouselEl, flavor).then((carousel) =>
      carouselReady.resolve({
        spinTarget: carousel.spinTarget,
        setFlavor: (key) => carousel.setFlavor(key as Flavor),
      }),
    );
  }

  // The hero's cans run on every screen; the scene picks the landscape or the
  // portrait choreography from its box.
  const heroEl = document.querySelector<HTMLElement>('[data-view="hero"]');
  if (heroEl) mountHeroScene(heroEl);
}
