import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { heroEntered, heroReady } from "../bridge";
import { setHeroSlideshowPaused } from "./heroSlideshow";

gsap.registerPlugin(ScrollTrigger);

/**
 * How long the hero copy will wait for the 3D cans before entering anyway.
 * The copy is the page's headline content; a slow connection or a machine
 * without WebGL must not leave it invisible.
 */
const READY_TIMEOUT = 2500;

/**
 * The hero's entrance, then its scroll choreography. On desktop the copy holds
 * until the cans are placed, so the two arrive together. Touch and portrait
 * screens start at once: a photo of the cans holds their place there until
 * the 3D (loaded after the page) takes over.
 */
export function runHeroIntro() {
  const waitForCans = matchMedia(
    "(min-width: 768px) and (pointer: fine) and (orientation: landscape)",
  ).matches;

  const ready = waitForCans
    ? Promise.race([
        heroReady.promise,
        new Promise((r) => setTimeout(r, READY_TIMEOUT)),
      ])
    : Promise.resolve();

  ready.then(play);
}

let played = false;

function play() {
  if (played) return;
  played = true;

  gsap
    .timeline()
    .set(".hero-fade", { opacity: 1 })
    .from(".hero-header-word", {
      scale: 3,
      opacity: 0,
      ease: "power4.in",
      delay: 0.3,
      stagger: 1,
    })
    .call(() => heroEntered.resolve())
    // The beat the leaf sprite's entrance used to take. The sprite is switched
    // off in the design, but its second still sits in the timing between the
    // headline and the subheading.
    .to({}, { duration: 1 }, "-=.35")
    .from(".hero-subheading", { opacity: 0, y: 30 }, "+=.4")
    .from(".hero-body", { opacity: 0, y: 10 })
    .from(".hero-cta", { opacity: 0, y: 12, stagger: 0.1, duration: 0.6 })
    .from(".hero-feature", { opacity: 0, y: 16, stagger: 0.12, duration: 0.6 })
    .from(".hero-scroll-cue", { opacity: 0, y: 10, duration: 0.6 });

  gsap
    .timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      },
    })
    // Same two-unit length as the original, whose first 1.5 units also moved
    // the (now hidden) leaf.
    .to({}, { duration: 1.5 }, 0)
    .to(".hero-scroll-cue", { opacity: 0, duration: 0.4 }, 0)
    // Photo dissolves to reveal the runway's cream ground underneath.
    // `autoAlpha`, so once it's gone it is `visibility: hidden` and the browser
    // stops compositing the full-screen layer under the 3D; the slideshow
    // holds while it can't be seen.
    .to(
      ".hero-bg",
      {
        autoAlpha: 0,
        duration: 1,
        onUpdate() {
          setHeroSlideshowPaused(this.progress() === 1);
        },
      },
      1,
    );

  // The runway copy arrives on its own trigger rather than on the scrubbed
  // timeline: it should read at its own pace once the section is in view.
  gsap.from(".brand-intro > *", {
    opacity: 0,
    y: 24,
    duration: 0.8,
    ease: "power2.out",
    stagger: 0.12,
    scrollTrigger: { trigger: ".text-side", start: "top 65%" },
  });
}
