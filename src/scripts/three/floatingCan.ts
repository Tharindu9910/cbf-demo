import { Group, MathUtils } from "three";

import { createSodaCan, type Flavor, type SodaCan } from "./sodaCan";

/**
 * `FloatingCan`: a can inside drei's `<Float>`, wrapped in an outer group.
 *
 * The outer group is the one GSAP animates and the one to size a can on —
 * `Float` owns the inner group's transform every frame, so anything set there
 * would be overwritten.
 */
export type FloatingCanOptions = {
  flavor?: Flavor;
  floatSpeed?: number;
  rotationIntensity?: number;
  floatIntensity?: number;
  floatingRange?: [number, number];
  scale?: number;
};

export type FloatingCan = {
  /** The outer group — animate and scale this one. */
  group: Group;
  can: SodaCan;
  /** Advance the float. Call once per frame with elapsed seconds. */
  update(elapsed: number): void;
  /** Where the can is in its bob, 0 at the bottom to 1 at the top. */
  readonly lift: number;
};

export async function createFloatingCan({
  flavor = "blackCherry",
  floatSpeed = 1.5,
  rotationIntensity = 1,
  floatIntensity = 1,
  floatingRange = [-0.1, 0.1],
  scale = 1,
}: FloatingCanOptions = {}): Promise<FloatingCan> {
  const can = await createSodaCan(flavor);

  const group = new Group();
  group.scale.setScalar(scale);

  // drei's Float: an outer group with no transform of its own, around an inner
  // one whose matrix it writes by hand each frame.
  const floatOuter = new Group();
  const floatInner = new Group();
  floatInner.matrixAutoUpdate = false;
  floatInner.add(can);
  floatOuter.add(floatInner);
  group.add(floatOuter);

  // Random phase per can, so a group of them never bobs in lockstep.
  const offset = Math.random() * 10000;
  let lift = 0.5;

  const update = (elapsed: number) => {
    if (floatSpeed === 0) return;
    // drei's Float formula, term for term.
    const t = offset + elapsed;
    floatInner.rotation.x = (Math.cos((t / 4) * floatSpeed) / 8) * rotationIntensity;
    floatInner.rotation.y = (Math.sin((t / 4) * floatSpeed) / 8) * rotationIntensity;
    floatInner.rotation.z = (Math.sin((t / 4) * floatSpeed) / 20) * rotationIntensity;
    const wave = Math.sin((t / 4) * floatSpeed);
    lift = (wave + 1) / 2;
    let y = wave / 10;
    y = MathUtils.mapLinear(y, -0.1, 0.1, floatingRange[0], floatingRange[1]);
    floatInner.position.y = y * floatIntensity;
    floatInner.updateMatrix();
  };

  return {
    group,
    can,
    update,
    get lift() {
      return lift;
    },
  };
}
