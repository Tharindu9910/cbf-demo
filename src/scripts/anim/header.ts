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

/**
 * Marks the header once the page has scrolled, which on phones turns the
 * pinned, invisible row into a frosted pill (see Header.astro).
 */
export function watchScroll() {
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  if (!header) return;

  let queued = false;
  const update = () => {
    queued = false;
    header.toggleAttribute("data-scrolled", scrollY > 8);
  };
  update();
  addEventListener(
    "scroll",
    () => {
      if (!queued) ((queued = true), requestAnimationFrame(update));
    },
    { passive: true },
  );
}

/**
 * The phone menu. Its top row repeats the header's logo and toggle at the same
 * spot, so the toggle seems to stay put and morph (☰ → ✕) while the panel
 * grows out of it as a circle, and the contents rise in one after another.
 * Closing reverses it and only then closes the modal, so focus returns to the
 * header's toggle.
 *
 * Esc and the close button close it the same way. A tapped link is marked
 * first (it turns green, nudges right and wipes a line along its divider
 * while the rest dim), then the page changes; a link to a section of this
 * page closes the menu before scrolling there. The menu closes at once if the
 * window widens past `md`, where it isn't styled.
 */
export function wireMenu() {
  const menu = document.querySelector<HTMLDialogElement>("#site-menu");
  const opener = document.querySelector<HTMLElement>("[data-menu-open]");
  const toggle = menu?.querySelector<HTMLElement>("[data-menu-close]");
  const logo = document.querySelector<HTMLElement>("[data-site-header] a");
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  const bar = menu?.querySelector<HTMLElement>("[data-menu-bar]");
  const menuLogo = bar?.querySelector<HTMLElement>("span");
  if (!menu || !opener || !toggle || !header || !bar || !logo || !menuLogo)
    return;

  /** The menu's copies, each paired with the header element it stands in for. */
  const twins = [
    [menuLogo, logo],
    [toggle, opener],
  ] as const;

  const items = menu.querySelectorAll<HTMLElement>("[data-menu-reveal]");
  const links = menu.querySelectorAll<HTMLAnchorElement>("a");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let tl: gsap.core.Timeline | null = null;
  let closing = false;

  /** The circle that clips the panel, centred on a toggle. */
  const circle = (r: number, on: HTMLElement = toggle) => {
    const b = on.getBoundingClientRect();
    return `circle(${r}px at ${b.left + b.width / 2}px ${b.top + b.height / 2}px)`;
  };

  /** How far a menu copy must shift to sit exactly over its header twin. */
  const offset = (copy: HTMLElement, twin: HTMLElement) => {
    const a = twin.getBoundingClientRect();
    const b = copy.getBoundingClientRect();
    return {
      x: a.left - b.left + Number(gsap.getProperty(copy, "x")),
      y: a.top - b.top + Number(gsap.getProperty(copy, "y")),
    };
  };
  const copies = twins.map(([copy]) => copy);

  const reset = () => {
    tl?.kill();
    tl = null;
    closing = false;
    delete toggle.dataset.state;
    links.forEach((a) => delete a.dataset.picked);
    gsap.set([menu, ...copies, ...items], { clearProps: "all" });
  };

  const open = () => {
    if (menu.open) return;
    reset();
    // Match the header's pill (or not) while the dialog is still hidden, so
    // the row starts in that layout instead of transitioning into it.
    bar.toggleAttribute("data-scrolled", header.hasAttribute("data-scrolled"));
    menu.showModal();
    // Focus the panel, not the close button the browser picks, so a tap
    // doesn't draw the toggle's focus ring; Tab still reaches it next.
    menu.focus({ preventScroll: true });
    // The row's padding transition can still fire on that first frame; land it.
    bar.getAnimations({ subtree: true }).forEach((a) => a.finish());
    if (reduced.matches) {
      toggle.dataset.state = "open";
      return;
    }

    /*
      The copies already share the header's layout; this only absorbs a pill
      still mid-transition when the menu opens. Measured after showModal, once
      the scroll lock has reflowed.
    */
    twins.forEach(([copy, twin]) => gsap.set(copy, offset(copy, twin)));
    const far = Math.hypot(innerWidth, innerHeight);
    gsap.set(menu, { clipPath: circle(24) });
    gsap.set(items, { y: 28, opacity: 0 });

    // Commit the ☰ frame before switching, or the morph is skipped.
    void toggle.offsetWidth;
    toggle.dataset.state = "open";

    tl = gsap
      .timeline({ defaults: { ease: "expo.out" } })
      .to(menu, { clipPath: circle(far), duration: 0.75, ease: "power3.inOut" })
      .to(copies, { x: 0, y: 0, duration: 0.6, ease: "power3.inOut" }, 0.1)
      .to(items, { y: 0, opacity: 1, duration: 0.8, stagger: 0.055 }, 0.25);
  };

  const close = (then?: () => void) => {
    if (!menu.open || closing) return;
    if (reduced.matches) return (menu.close(), then?.());
    closing = true;
    tl?.kill();
    delete toggle.dataset.state;

    tl = gsap
      .timeline({ onComplete: () => (menu.close(), reset(), then?.()) })
      .to(
        items,
        {
          y: 16,
          opacity: 0,
          duration: 0.25,
          stagger: { each: 0.03, from: "end" },
          ease: "power2.in",
        },
        0,
      )
      .to(
        menu,
        { clipPath: circle(24, opener), duration: 0.55, ease: "power3.inOut" },
        0.1,
      );
    twins.forEach(([copy, twin]) =>
      tl!.to(
        copy,
        { ...offset(copy, twin), duration: 0.45, ease: "power3.inOut" },
        0.1,
      ),
    );
  };

  opener.addEventListener("click", open);
  const pick = (e: MouseEvent, a: HTMLAnchorElement) => {
    // New tab/window clicks and reduced motion keep the browser's behaviour.
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (reduced.matches) return void menu.close();
    e.preventDefault();
    if (closing || a.dataset.picked) return;

    a.dataset.picked = "";
    const row = a.closest<HTMLElement>("[data-menu-reveal]");
    gsap.to(
      [...items].filter((el) => el !== row),
      { opacity: 0.35, duration: 0.3, ease: "power2.out", overwrite: "auto" },
    );

    const target = new URL(a.href);
    const samePage = target.pathname === location.pathname && target.hash;
    gsap.delayedCall(0.45, () =>
      samePage
        ? close(() => {
            history.pushState(null, "", target.hash);
            document
              .getElementById(target.hash.slice(1))
              ?.scrollIntoView({ behavior: "smooth" });
          })
        : location.assign(target.href),
    );
  };

  toggle.addEventListener("click", () => close());
  links.forEach((a) => a.addEventListener("click", (e) => pick(e, a)));
  // Coming back via the back button restores the page as it was left: shut.
  addEventListener("pageshow", (e) => {
    if (e.persisted && menu.open) {
      menu.close();
      reset();
    }
  });
  // Esc: animate out instead of letting the browser close it outright.
  menu.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });

  matchMedia("(min-width: 768px)").addEventListener("change", (e) => {
    if (e.matches && menu.open) {
      menu.close();
      reset();
    }
  });
}
