/**
 * Scroll reveals, site-wide. Every `[data-reveal]` still below the fold when
 * the page starts plays once, as it comes into view:
 *
 *   - a text block (a heading, or a block with a heading in it): its parts
 *     follow in reading order. The eyebrow rises, the heading's lines slide up
 *     out of a mask one after another, then the copy and the call to action;
 *   - anything else (a card, a photo, a list): one soft rise.
 *
 * Blocks that come into view together are staggered, so a row of cards ripples
 * in rather than landing at once.
 *
 * Nothing is ever hidden without script, under reduced motion, or above the
 * fold, and GSAP and SplitText are only fetched when there is something below
 * the fold to reveal. Hidden parts keep `opacity` only (never `visibility`), so
 * screen readers and in-page search still find them, and focusing into one
 * reveals it at once. SplitText keeps a heading read as one label while it is
 * split, and is reverted when the lines are in, so the settled markup is
 * exactly the page's own.
 */
import type { gsap as Gsap } from "gsap";
import type { SplitText as SplitTextType } from "gsap/SplitText";

const HEADING = "h1, h2, h3";
/** Below this share of the viewport's height counts as "below the fold". */
const FOLD = 0.92;
/** Blocks entering together start this far apart (s). */
const BATCH_STAGGER = 0.08;
/** A text block's parts start this far apart (s). */
const PART_STAGGER = 0.12;

type Reveal = { block: HTMLElement; parts: HTMLElement[]; text: boolean };

export async function revealOnScroll() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  const belowFold = (el: Element) => el.getBoundingClientRect().top > innerHeight * FOLD;
  const blocks = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
  if (!blocks.some(belowFold)) return;

  const [{ gsap }, { SplitText }] = await Promise.all([import("gsap"), import("gsap/SplitText")]);
  gsap.registerPlugin(SplitText);
  // Line breaks depend on the faces; split only once they are in.
  await document.fonts.ready;

  // Measured again: whatever came into view while that loaded stays as it is.
  const reveals = blocks.filter(belowFold).map(plan);
  const pending = new Map(reveals.map((r) => [r.block, r]));

  for (const { parts, text } of reveals) {
    for (const part of parts) {
      // A heading only fades while its lines are masked; everything else also rises.
      gsap.set(part, {
        opacity: 0,
        y: text && isSplittable(part) ? 0 : text ? 24 : 32,
        // CSS transitions on transform or opacity (hover states) would fight the tween.
        transition: "none",
      });
    }
  }

  const play = (reveal: Reveal, delay = 0) => {
    pending.delete(reveal.block);
    io.unobserve(reveal.block);
    animate(gsap, SplitText, reveal, delay);
  };

  const io = new IntersectionObserver(
    (entries) => {
      const entering = entries
        .filter((e) => e.isIntersecting)
        .map((e) => pending.get(e.target as HTMLElement))
        .filter((r): r is Reveal => r !== undefined)
        // Reading order, so a row ripples left to right and top to bottom.
        .sort((a, b) => {
          const ra = a.block.getBoundingClientRect();
          const rb = b.block.getBoundingClientRect();
          return ra.top - rb.top || ra.left - rb.left;
        });
      entering.forEach((r, i) => play(r, i * BATCH_STAGGER));
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  for (const { block } of reveals) io.observe(block);

  // Tabbing (or a find-in-page jump) into a hidden block shows it straight away.
  addEventListener("focusin", (event) => {
    for (const [block, reveal] of pending) {
      if (block.contains(event.target as Node)) play(reveal);
    }
  });
}

/** What a block reveals: its parts in reading order, and whether it reads as text. */
function plan(block: HTMLElement): Reveal {
  // A heading on its own (a section title marked by itself).
  if (block.matches(HEADING)) return { block, parts: [block], text: true };

  const heading = block.querySelector(HEADING);
  // Nested reveals play by themselves, so a block holding one rises whole.
  if (!heading || block.querySelector("[data-reveal]")) return { block, parts: [block], text: false };

  // Step down through single wrappers to the level the heading's siblings live at.
  let root: Element = block;
  while (root.children.length === 1 && !root.firstElementChild!.matches(HEADING)) {
    root = root.firstElementChild!;
  }
  const parts = [...root.children].filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.getClientRects().length > 0,
  );
  return parts.length > 1 ? { block, parts, text: true } : { block, parts: [block], text: false };
}

/** A heading whose lines can rise out of a mask. Clipped-gradient text can't be split. */
function isSplittable(el: HTMLElement) {
  if (!el.matches(HEADING)) return false;
  const clip = getComputedStyle(el).getPropertyValue("background-clip");
  return clip !== "text";
}

function animate(gsap: typeof Gsap, SplitText: typeof SplitTextType, { parts }: Reveal, delay: number) {
  const splits: SplitTextType[] = [];
  const tl = gsap.timeline({
    delay,
    defaults: { duration: 0.8, ease: "power3.out" },
    onComplete: () => {
      for (const split of splits) split.revert();
      gsap.set(parts, { clearProps: "opacity,transform,transition" });
    },
  });

  parts.forEach((part, i) => {
    const at = i === 0 ? 0 : `<${PART_STAGGER}`;
    if (!isSplittable(part)) {
      tl.to(part, { opacity: 1, y: 0 }, at);
      return;
    }

    gsap.set(part, { opacity: 1 });
    const split = SplitText.create(part, { type: "lines", mask: "lines" });
    splits.push(split);
    // Room inside each mask for ascenders and descenders, which tight display
    // leading pushes past the line box. The negative margins cancel it out.
    gsap.set(split.masks, {
      paddingTop: "0.12em",
      paddingBottom: "0.18em",
      marginTop: "-0.12em",
      marginBottom: "-0.18em",
    });
    tl.from(split.lines, { yPercent: 130, duration: 1, ease: "power4.out", stagger: 0.1 }, at);
  });
}
