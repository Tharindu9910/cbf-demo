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

  // The scroll timeline, rebuilt by `build` below. The shadows read its
  // progress every frame.
  let scrollTl: gsap.core.Timeline | null = null;
  let lastElapsed = 0;

  const view = addView(el, scene);
  view.update = (elapsed) => {
    const dt = Math.min(elapsed - lastElapsed, 0.1);
    lastElapsed = elapsed;

    // The shadows belong to the arrangement: hidden while the scroll is
    // still spinning the cans in, rising over the end of the approach so
    // they are on the floor before the cans settle, and gone again when it
    // scrolls back. `presence` eases toward that target rather than jumping
    // to it, so a fast scroll can't flicker them.
    const t = ((scrollTl?.progress() ?? 0) - SHADOW_FROM) / (SHADOW_TO - SHADOW_FROM);
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

  // The entrance plays once per page. A resize rebuilds the timelines below,
  // and without this it would replay the drop under the reader.
  let introPlayed = false;
  let ctx: gsap.Context | null = null;
  let builtFor = NaN;

  const build = () => {
    // Quantised so that dragging a window edge rebuilds the timelines a
    // handful of times rather than on every frame.
    const stageWidth = Math.round(view.viewport.width * 20) / 20;
    const halfWidth = stageWidth > 0 ? stageWidth / 2 : REFERENCE_HALF_WIDTH;
    if (halfWidth === builtFor) return;
    builtFor = halfWidth;

    ctx?.revert();

    const { fit, anchorX } = anchoredLayout(halfWidth);

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
        x: atDepth(-0.61 * halfWidth, CLUSTER[0].z),
        y: atDepth(0.1, CLUSTER[0].z),
        z: CLUSTER[0].z,
      });
      gsap.set(left.rotation, { y: 0.29, z: -0.3 });

      gsap.set(right.position, {
        x: atDepth(0.61 * halfWidth, CLUSTER[2].z),
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
