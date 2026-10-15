import type { Flavor } from "./sodaCan";

/**
 * The assembled three-can arrangement, and the arithmetic for laying it into a
 * frame. Ported verbatim from the Next build, where the hero scrolled into it
 * and the flavour lineup stood in it; only the hero uses it here. Keep it in
 * step with that copy if either changes.
 */

/** World height and width-over-height of the can — see `SodaCan`'s CAN_HEIGHT. */
const CAN_HEIGHT = 1.64;
const CAN_ASPECT = 0.41;

/**
 * The camera is fov 30 at z 5 (`stage.ts`), so at z 0 the frame is a fixed
 * 2.68 world units tall — the fov never changes — and `2.68 * aspect` wide.
 */
const CAMERA_Z = 5;
const FRAME_HEIGHT = 2.68;

/**
 * The arrangement, measured off the concept artwork rather than eyeballed: its
 * own frame is 1670 x 920, and each can is the centre of its silhouette and its
 * height, in those pixels. `ARTWORK_PX` converts all of it in one step, so the
 * layout below is the concept's proportions and not an approximation of them.
 *
 * `z` is the only free number — the artwork is flat, so it says how far apart
 * the cans read but not how that is built. The three depths reproduce it while
 * keeping the group shallow enough that the scroll spin stays graceful; each
 * can's `scale` is then *derived* from its measured height at that depth, so
 * moving one back or forward can't change how big it lands on screen.
 */
const ARTWORK = {
  width: 1670,
  height: 920,
  // Ordered back-left, front-centre, back-right; both scenes rely on that order.
  //
  // The three stand in a closed row: on can widths of 193, 262 and 185, each
  // side can tucks about 33px behind the front one — a sixth of its own width,
  // enough to bind the group without covering a label. That is the whole look,
  // and it is a narrow band — pull a side can further in and it disappears
  // behind the front can, push it out and the group falls apart into three
  // separate cans. So when the front can's `height` is changed, move the two
  // `x` either side by half of what its width changed by, or the group loosens
  // as it shrinks; those two overlaps are the thing to check first, ahead of
  // anything else here.
  cans: [
    // Mango Passion, its right edge tucked behind the front can.
    {
      key: "left" as const,
      flavor: "grape" as Flavor,
      x: 986,
      y: 400,
      height: 470,
      z: -0.55,
      /** Yaw, turning the can back towards the camera so its label reads. */
      ry: 0.12,
    },
    // Pineapple — the brand's hero flavour, front and lowest, as in the artwork.
    {
      key: "center" as const,
      flavor: "blackCherry" as Flavor,
      x: 1180,
      y: 431,
      height: 640,
      z: 0.35,
      ry: 0.02,
    },
    // Matcha Original, tucked behind the front can by the same margin as the
    // left one so the row closes symmetrically.
    {
      key: "right" as const,
      flavor: "lemonLime" as Flavor,
      x: 1370,
      y: 385,
      height: 450,
      z: -0.95,
      ry: -0.12,
    },
  ],
};

/** World units per artwork pixel. */
const ARTWORK_PX =
  (FRAME_HEIGHT * (ARTWORK.width / ARTWORK.height)) / ARTWORK.width;

export const REFERENCE_HALF_WIDTH = (ARTWORK.width * ARTWORK_PX) / 2;

/** The front can, which the whole group hangs off. */
const ANCHOR = ARTWORK.cans[1];

/**
 * Where the group sits in the hero, as a share of the half-width and in world
 * units up from the middle, so it holds the artwork's place in the frame from a
 * 13" laptop to an ultrawide.
 */
const ANCHOR_RATIO =
  ((ANCHOR.x - ARTWORK.width / 2) * ARTWORK_PX) / REFERENCE_HALF_WIDTH;
export const ANCHOR_Y = (ARTWORK.height / 2 - ANCHOR.y) * ARTWORK_PX;

/**
 * Place a can by where it should appear *on screen* rather than by its raw x/y.
 * Perspective pulls everything behind z 0 in towards the centre of the frame, so
 * a can that is set back also has to be pushed out to hold its place in the
 * layout — this is what keeps the arrangement the artwork's at every depth.
 */
export function atDepth(screenValue: number, z: number) {
  return (screenValue * (CAMERA_Z - z)) / CAMERA_Z;
}

/**
 * How wide a can stands and how far its base is below its middle, once a scene
 * has scaled it — `scale * fit`, the number handed to `FloatingCan`. The can is
 * centred on its own origin, so the drop is half its height. Here rather than
 * in the scenes because these two numbers are the model's, and this module is
 * where the model's dimensions live.
 */
export function canFootprint(canScale: number) {
  return {
    width: CAN_HEIGHT * CAN_ASPECT * canScale,
    drop: (CAN_HEIGHT / 2) * canScale,
  };
}

/**
 * Each can as a scene wants it: offsets on screen from the front can, and the
 * scale that lands it at its measured height once its depth has had its way.
 */
export const CLUSTER = ARTWORK.cans.map(
  ({ key, flavor, x, y, height, z, ry }) => {
    const apparentHeight = height * ARTWORK_PX;

    return {
      key,
      flavor,
      z,
      ry,
      screenX: (x - ANCHOR.x) * ARTWORK_PX,
      screenY: (ANCHOR.y - y) * ARTWORK_PX,
      scale: (apparentHeight / CAN_HEIGHT) * ((CAMERA_Z - z) / CAMERA_Z),
      /** Half the can's width on screen, for the fits below. */
      reach: (apparentHeight * CAN_ASPECT) / 2,
    };
  },
);

/** How far right of, and left of, the anchor the group reaches at full size. */
const CLUSTER_REACH = Math.max(
  ...CLUSTER.map(({ screenX, reach }) => screenX + reach),
);
const CLUSTER_LEFT = Math.min(
  ...CLUSTER.map(({ screenX, reach }) => screenX - reach),
);

/** The group's own midpoint, as an offset from the anchor. */
const CLUSTER_MID = (CLUSTER_LEFT + CLUSTER_REACH) / 2;
const CLUSTER_SPAN = CLUSTER_REACH - CLUSTER_LEFT;

/**
 * Air kept outside the group, as a share of the half-width — the artwork leaves
 * this much between the right-hand can and the edge. Proportional rather than
 * absolute, so a small window keeps the same border as a large one instead of
 * pressing the cans against the edge.
 */
const FRAME_MARGIN_RATIO = 0.14;

/** Floor on the hero's `fit`, so a tall narrow window still gets readable cans. */
const MIN_FIT = 0.5;

export type ClusterLayout = {
  /**
   * How much of the artwork's size this window can take. 1 on anything wide
   * enough, where the arrangement is then the concept's proportions exactly.
   * Spacing and can size share it, so the group tightens as a whole rather than
   * the cans drifting apart from each other.
   */
  fit: number;
  /** Where the front can stands; every other can is placed relative to it. */
  anchorX: number;
};

/**
 * The hero's placement: the group sits right of centre, in the artwork's own
 * share of the width, with the copy beside it.
 *
 * Once `fit` has bottomed out on a really narrow window the group is wider than
 * the space to the right of the anchor, so the anchor gives ground and slides
 * back towards the middle. Without that the right-hand can is the one that pays,
 * and it ends up jammed against the edge of the frame.
 */
export function anchoredLayout(halfWidth: number): ClusterLayout {
  const edge = halfWidth * (1 - FRAME_MARGIN_RATIO);
  const fit = Math.min(
    1,
    Math.max(MIN_FIT, (edge - halfWidth * ANCHOR_RATIO) / CLUSTER_REACH),
  );

  return {
    fit,
    anchorX: Math.min(halfWidth * ANCHOR_RATIO, edge - CLUSTER_REACH * fit),
  };
}

/**
 * The group centred in the frame, whole and clear of both edges — the state the
 * lineup starts from. No floor on `fit` here: centred, there is nowhere for an
 * oversized group to go, so on a phone it would simply run off both sides. It
 * stays generous in practice, since the group is only two-thirds of the artwork
 * frame wide to begin with.
 */
export function centredLayout(halfWidth: number): ClusterLayout {
  const fit = Math.min(
    1,
    (2 * halfWidth * (1 - FRAME_MARGIN_RATIO)) / CLUSTER_SPAN,
  );

  return { fit, anchorX: -CLUSTER_MID * fit };
}

/** The front can's height on screen at full size; it spans the group's full height. */
const GROUP_HEIGHT = ANCHOR.height * ARTWORK_PX;

/** Share of a slot's height the group may fill, leaving room for the float. */
const SLOT_FILL = 0.88;

/**
 * The portrait (phone) placement: the group centred in a box on the page — a
 * `[data-can-slot]` — and as large as that box allows on both axes. The front
 * can is the group's tallest member and stands at the box's vertical middle,
 * so the caller centres it on the slot and offsets the others by `screenY`.
 *
 * `halfWidth` and `height` are the slot's, in world units at z 0.
 */
export function slotLayout(halfWidth: number, height: number): ClusterLayout {
  const fit = Math.min(
    1,
    centredLayout(halfWidth).fit,
    (height * SLOT_FILL) / GROUP_HEIGHT,
  );

  return { fit, anchorX: -CLUSTER_MID * fit };
}
