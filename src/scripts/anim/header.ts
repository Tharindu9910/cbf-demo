import { gsap } from "gsap";

/** The header drops in item by item. */
export function animateHeader() {
  gsap.from(".site-nav-item", {
    y: -24,
    opacity: 0,
    stagger: 0.08,
    duration: 0.7,
    delay: 0.2,
    ease: "power3.out",
  });
}
