import { Group, Scene } from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  ANCHOR_Y,
  CLUSTER,
  REFERENCE_HALF_WIDTH,
  anchoredLayout,
  atDepth,
  canFootprint,
  slotLayout,
} from "../three/canCluster";
import { createContactShadow, type ContactShadow } from "../three/contactShadow";
import { applyEnvironment } from "../three/environment";
import { createFloatingCan, type FloatingCan } from "../three/floatingCan";
import { addCanLights } from "../three/lights";
import { addView, onViewResize } from "../three/stage";
import { heroReady } from "../bridge";
import { url } from "../../config/url";

gsap.registerPlugin(ScrollTrigger);

const FLOAT_SPEED = 1.5;

/** The squarest frame the landscape choreography is laid out for as ported: 16:10. */
const LAPTOP_ASPECT = 1.6;

/** Seconds for the shadows to fade in or out. */
const SHADOW_FADE = 0.35;

/**
 * The stretch of the scroll timeline over which the shadows come in: they
 * start to show while the cans are still gliding into the arrangement and are
 * at full strength just before the cans come to rest.
 */
const SHADOW_FROM = 0.82;
const SHADOW_TO = 0.97;

/**
 * The hero's three cans: they frame the headline, drop in once, then spin and
 * settle into the artwork's arrangement as the hero scrolls. A port of the
 * Next build's `Hero/Scene.tsx`.
 *
 * That choreography needs a landscape frame — the cans stand either side of
 * the headline. On a portrait screen (phones, upright tablets) there is no
 * "either side", so the group instead stands assembled in a box above the
 * headline (`[data-can-slot="top"]`), and the same scroll carries it, spinning,
 * down into a box under the runway copy (`[data-can-slot="end"]`), which it
 * reaches as the hero lets go of it. Rotating the device switches between the
 * two.
 */
export async function mountHeroScene(el: HTMLElement) {
  const scene = new Scene();
  const group = new Group();
  scene.add(group);

  const cans: Record<string, FloatingCan> = {};
  const wrappers: Record<string, Group> = {};
  const shadows: Record<string, ContactShadow> = {};
  /** Each shadow's floor height, set in `build` under the can's settled spot. */
  const floorY: Record<string, number> = {};

  await Promise.all([
    ...CLUSTER.map(async ({ key, flavor }) => {
      const wrapper = new Group();
      const can = await createFloatingCan({
        flavor,
        floatSpeed: FLOAT_SPEED,
        // The front can is held steadier than the two behind it, so it doesn't
        // bob out of the arrangement they're framing.
        floatIntensity: key === "center" ? 0.6 : 0.9,
      });
      wrapper.add(can.group);
      // A sibling of the can, not a child: it holds the floor while the can
      // bobs, and follows only the can's x/z as the scroll brings it in.
      const shadow = createContactShadow();
      wrapper.add(shadow.mesh);
      shadows[key] = shadow;
      wrappers[key] = wrapper;
      cans[key] = can;
    }),
    applyEnvironment(scene, url("/hdr/lobby.hdr"), { intensity: 0.4 }),
  ]);

  // Back-left, front-centre, back-right — the order the cluster is in.
  for (const { key } of CLUSTER) group.add(wrappers[key]);
  addCanLights(scene);

  // The scroll timeline (landscape), rebuilt by `build` below. The shadows
  // read its progress every frame.
  let scrollTl: gsap.core.Timeline | null = null;
  /** The portrait choreography's state while it is the one running. */
  let portrait: PortraitState | null = null;
  let lastElapsed = 0;

  const hero = el.closest<HTMLElement>(".hero");
  let drawn = false;

  const view = addView(el, scene);
  view.update = (elapsed) => {
    const dt = Math.min(elapsed - lastElapsed, 0.1);
    lastElapsed = elapsed;

    // The photo of the cans holds their place on phones until the real ones
    // are drawn; this frame is the first, so it can go.
    if (!drawn) {
      drawn = true;
      requestAnimationFrame(() => hero?.setAttribute("data-hero-3d", ""));
    }

    if (portrait) portraitFrame(portrait, elapsed, dt);

    // The shadows belong to the arrangement: hidden while the scroll is
    // still spinning the cans in, rising over the end of the approach so
    // they are on the floor before the cans settle, and gone again when it
    // scrolls back. `presence` eases toward that target rather than jumping
    // to it, so a fast scroll can't flicker them.
    const progress = portrait ? portrait.rise : (scrollTl?.progress() ?? 0);
    const t = (progress - SHADOW_FROM) / (SHADOW_TO - SHADOW_FROM);
    const k = Math.min(1, Math.max(0, t));
    const target = k * k * (3 - 2 * k);
    const step = dt / SHADOW_FADE;

    for (const { key } of CLUSTER) {
      cans[key].update(elapsed);
      const shadow = shadows[key];
      shadow.presence += Math.max(-step, Math.min(step, target - shadow.presence));
      // Under the can wherever it is on its way in, on the settled floor.
      const { position } = cans[key].group;
      shadow.mesh.position.set(position.x, floorY[key], position.z);
      shadow.update(cans[key].lift);
    }
  };

  // ---- Portrait ----
  //
  // Two boxes in the page hold the group: `top`, above the headline, and
  // `end`, under the runway copy. On the first screen the cans are drawn
  // locked to `top` — the whole view is shifted up with the scroll, pixel
  // for pixel — so they leave over the top of the screen with it instead of
  // crossing the copy. Once the runway's cream ground is coming up, they rise
  // from under the frame into `end`, spinning to a stop, and arrive as the
  // hero lets go of its sticky box, so they then scroll away with the page.
  // Driven per frame rather than by a scrubbed timeline: the first leg has to
  // track the page exactly, which a scrub's lag can't.

  const slotTop = document.querySelector<HTMLElement>('[data-can-slot="top"]');
  const slotEnd = document.querySelector<HTMLElement>('[data-can-slot="end"]');
  const runway = document.querySelector<HTMLElement>("#scroll");

  /** How fast the rise catches up with the scroll, per second. */
  const RISE_FOLLOW = 5;
  /** Seconds between re-reading the page layout while portrait runs. */
  const MEASURE_EVERY = 0.5;

  /** A slot's group layout, in world units, where the pinned view sees it at `scrollY`. */
  const measureSlot = (slot: HTMLElement | null, scrollY: number, box: DOMRect) => {
    const k = view.viewport.height / (box.height || 1);
    const r = slot?.getBoundingClientRect() ?? new DOMRect(0, box.height / 4, box.width, box.height / 2);
    // Both moments it is read for are ones where the box is pinned at the top
    // of the screen, so the box's own position now doesn't come into it.
    const top = r.top + window.scrollY - scrollY;
    const halfWidth = (r.width / 2) * k;
    return {
      cx: (r.left + r.width / 2 - box.width / 2) * k,
      cy: (box.height / 2 - (top + r.height / 2)) * k,
      ...slotLayout(halfWidth, r.height * k),
    };
  };
  type Slot = ReturnType<typeof measureSlot>;

  type PortraitState = {
    top: Slot;
    end: Slot;
    /** Scroll at which the top slot has left the screen. */
    holdUntil: number;
    /** Scroll range over which the group rises into the end slot. */
    riseFrom: number;
    riseTo: number;
    /** 0 below the frame, 1 settled in the end slot; eased toward the scroll. */
    rise: number;
    measuredAt: number;
    /** World units per CSS pixel at z 0. */
    k: number;
  };

  const measurePortrait = (state?: PortraitState): PortraitState => {
    const box = el.getBoundingClientRect();
    const y = window.scrollY;
    const screen = window.innerHeight;
    // Where the sticky box lets go: its parent's bottom reaching the box's.
    const release = (el.parentElement ?? el).getBoundingClientRect().bottom + y;
    const riseTo = Math.max(1, release - box.height);
    const holdUntil = slotTop ? slotTop.getBoundingClientRect().bottom + y + 24 : 0;
    const runwayTop = runway ? runway.getBoundingClientRect().top + y : holdUntil;
    const riseFrom = Math.min(riseTo - 1, Math.max(holdUntil, runwayTop - screen * 0.55));
    const next = {
      top: measureSlot(slotTop, 0, box),
      end: measureSlot(slotEnd, riseTo, box),
      holdUntil,
      riseFrom,
      riseTo,
      rise: state?.rise ?? 0,
      measuredAt: lastElapsed,
      k: view.viewport.height / (box.height || 1),
    };

    // The floor is the end slot's, under where each can settles.
    for (const c of CLUSTER) {
      const scale = c.scale * next.end.fit;
      const { width, drop } = canFootprint(scale);
      shadows[c.key].setWidth(width);
      floorY[c.key] = atDepth(next.end.cy + c.screenY * next.end.fit, c.z) - drop - 0.14 * scale;
    }
    return next;
  };

  const portraitFrame = (state: PortraitState, elapsed: number, dt: number) => {
    if (elapsed - state.measuredAt > MEASURE_EVERY) {
      portrait = state = measurePortrait(state);
    }

    const y = window.scrollY;
    const target = Math.min(1, Math.max(0, (y - state.riseFrom) / (state.riseTo - state.riseFrom)));
    state.rise += (target - state.rise) * (1 - Math.exp(-dt * RISE_FOLLOW));
    if (Math.abs(target - state.rise) < 1e-4) state.rise = target;

    // No top slot, no hold. Without the guard, iOS's rubber-band at the top
    // (scrollY < 0) reads as holding and draws the group over the headline
    // in `measureSlot`'s fallback box.
    const holding = slotTop !== null && y < state.holdUntil;
    // First leg: drawn with the page. Second: still frame, cans move.
    view.offsetY = holding ? Math.max(0, y) : 0;

    const slot = holding ? state.top : state.end;
    // Rise: the end slot is measured where it stands once the scroll is
    // done, so first follow it up the screen with the page, exactly — the
    // cans then never sit over the copy above it — plus an ease-out lift from
    // most of a frame below it.
    const e = 1 - (1 - state.rise) ** 3;
    const below = holding
      ? 0
      : Math.max(0, state.riseTo - y) * state.k + (1 - e) * view.viewport.height * 0.7;
    group.rotation.y = holding
      ? (y / Math.max(1, state.holdUntil)) * 0.6
      : (1 - e) * Math.PI * 2;

    for (const c of CLUSTER) {
      const can = cans[c.key].group;
      can.scale.setScalar(c.scale * slot.fit);
      can.position.set(
        atDepth(slot.cx + slot.anchorX + c.screenX * slot.fit, c.z),
        atDepth(slot.cy + c.screenY * slot.fit - below, c.z),
        c.z,
      );
      can.rotation.set(0, c.ry, 0);
    }
  };

  const buildPortrait = () => {
    portrait = measurePortrait();

    if (!introPlayed && window.scrollY < 20) {
      introPlayed = true;

      // Up into the slot from under the frame, the back pair first and the
      // front can last, so it lands in front of them.
      const tl = gsap.timeline({ defaults: { duration: 2.2, ease: "back.out(1.3)" } });
      CLUSTER.forEach(({ key }, i) => {
        const at = key === "center" ? 0.3 : i * 0.12;
        const x = key === "left" ? -0.4 : key === "right" ? 0.4 : 0;
        tl.from(wrappers[key].position, { y: -3.2, x }, at).from(
          wrappers[key].rotation,
          { z: key === "right" ? -2 : 2 },
          at,
        );
      });
    }
  };

  // The entrance plays once per page. A resize rebuilds the timelines below,
  // and without this it would replay the drop under the reader.
  let introPlayed = false;
  let ctx: gsap.Context | null = null;
  let builtFor = "";

  const build = () => {
    // Quantised so that dragging a window edge rebuilds the timelines a
    // handful of times rather than on every frame.
    const stageWidth = Math.round(view.viewport.width * 20) / 20;
    const isPortrait = view.viewport.width > 0 && view.viewport.width < view.viewport.height;
    // Past 21:9 the choreography lays out in a 21:9 band in the middle, so
    // an ultrawide doesn't spread the cans out to its far edges, away from
    // the headline and the copy.
    const halfWidth =
      stageWidth > 0
        ? Math.min(stageWidth / 2, (view.viewport.height * (21 / 9)) / 2)
        : REFERENCE_HALF_WIDTH;
    // The choreography is the laptop's. A can's size on screen follows the
    // frame's height (the fov is fixed), so on a squarer screen (4:3 tablets,
    // a narrow window) the cans are too big for its width: the framing pair
    // runs into the headline and the settled group into the copy. Shrink
    // them there, a little faster than the width shrinks; at 16:10 and wider
    // this is 1 and nothing changes.
    const aspect = view.viewport.width / (view.viewport.height || 1);
    const narrow = Math.min(1, aspect / LAPTOP_ASPECT) ** 1.5;
    const key = `${isPortrait}:${halfWidth}:${Math.round(narrow * 100)}`;
    if (key === builtFor) return;
    builtFor = key;

    ctx?.revert();
    portrait = null;
    view.offsetY = 0;
    group.rotation.y = 0;

    if (isPortrait) {
      ctx = gsap.context(() => buildPortrait());
      return;
    }

    const layout = anchoredLayout(halfWidth);
    const fit = layout.fit * narrow;
    const { anchorX } = layout;
    // The framing pair's share of the half-width: the ported 0.61, eased
    // outward as the screen gets squarer so the pair still clears the headline.
    const flank = 0.61 + 0.2 * (1 - narrow);

    // Size is set here and position/rotation are GSAP's, so a resize can
    // re-size the cans without the two fighting over the same group.
    for (const { key, scale, screenX, screenY, z } of CLUSTER) {
      cans[key].group.scale.setScalar(scale * fit);

      // The floor under where the can settles: just below its base, with a
      // little air so it reads as floating rather than standing.
      const { width, drop } = canFootprint(scale * fit);
      shadows[key].setWidth(width);
      floorY[key] = atDepth((ANCHOR_Y + screenY) * fit, z) - drop - 0.14 * scale * fit;
    }

    ctx = gsap.context(() => {
      const [left, center, right] = CLUSTER.map(({ key }) => cans[key].group);
      const leftWrapper = wrappers[CLUSTER[0].key];
      const rightWrapper = wrappers[CLUSTER[2].key];

      // Top of the hero: the outer pair frames the centred headline, each
      // already at the depth it keeps for the rest of the section. The front
      // can waits below the frame and the scroll lifts it in.
      gsap.set(left.position, {
        x: atDepth(-flank * halfWidth, CLUSTER[0].z),
        y: atDepth(0.1, CLUSTER[0].z),
        z: CLUSTER[0].z,
      });
      gsap.set(left.rotation, { y: 0.29, z: -0.3 });

      gsap.set(right.position, {
        x: atDepth(flank * halfWidth, CLUSTER[2].z),
        y: 0,
        z: CLUSTER[2].z,
      });
      gsap.set(right.rotation, { y: -0.29, z: 0.26 });

      gsap.set(center.position, {
        x: atDepth(anchorX, CLUSTER[1].z),
        y: -2.6,
        z: CLUSTER[1].z,
      });
      gsap.set(center.rotation, { y: CLUSTER[1].ry, z: 0.1 });

      if (!introPlayed && window.scrollY < 20) {
        introPlayed = true;

        gsap
          .timeline({ defaults: { duration: 3, ease: "back.out(1.4)" } })
          .from(leftWrapper.position, { y: -5, x: 1 }, 0)
          .from(leftWrapper.rotation, { z: 3 }, 0)
          // Mirrored, so the pair separates outward as it lands.
          .from(rightWrapper.position, { y: 5, x: -1 }, 0)
          .from(rightWrapper.rotation, { z: 3 }, 0);
      }

      scrollTl = gsap.timeline({
        defaults: { duration: 2 },
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
        },
      });

      // A whole turn, so the group lands back on its own axis and the cans
      // arrive exactly as the artwork has them.
      scrollTl.to(group.rotation, { y: Math.PI * 2 }, 0);

      // The artwork, laid into the frame: the anchor at its share of the
      // width, every other can at its measured offset from it. Upright — the
      // tilts above belong to the entrance, not to this.
      for (const { key, screenX, screenY, z, ry } of CLUSTER) {
        const can = cans[key].group;
        scrollTl
          .to(
            can.position,
            {
              x: atDepth(anchorX + screenX * fit, z),
              y: atDepth((ANCHOR_Y + screenY) * fit, z),
              z,
            },
            0,
          )
          .to(can.rotation, { y: ry, z: 0 }, 0);
      }
    });
  };

  build();
  onViewResize(view, build);

  // The hero copy holds its entrance until the cans are in place.
  heroReady.resolve();
}
