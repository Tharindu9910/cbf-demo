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

  mountLoader();
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

  // The hero's cans are a desktop-only effect (phones get a flat image), so
  // they mount the first time the window is wide enough.
  const heroEl = document.querySelector<HTMLElement>('[data-view="hero"]');
  if (heroEl) {
    const desktop = matchMedia("(min-width: 768px)");
    const mountOnce = () => {
      if (!desktop.matches) return;
      desktop.removeEventListener("change", mountOnce);
      mountHeroScene(heroEl);
    };
    desktop.addEventListener("change", mountOnce);
    mountOnce();
  }
}
