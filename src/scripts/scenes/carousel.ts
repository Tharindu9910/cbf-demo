import { Box3, Group, Scene, Vector3 } from "three";

import { applyEnvironment } from "../three/environment";
import { createFloatingCan } from "../three/floatingCan";
import { addCanLights } from "../three/lights";
import { addView, warmUp } from "../three/stage";
import { labelTextures, type Flavor } from "../three/sodaCan";
import { url } from "../../config/url";

/**
 * The carousel's single can, centred in its square box and pulled 1.5 units
 * towards the camera — drei's `<Center position={[0, 0, 1.5]}>` around a
 * `FloatingCan`. Lighting is the hero's rig, so the can doesn't change
 * character between the two sections.
 */
export async function mountCarouselScene(el: HTMLElement, flavor: Flavor) {
  const scene = new Scene();

  const [floating] = await Promise.all([
    createFloatingCan({ flavor, floatIntensity: 0.3, rotationIntensity: 1 }),
    applyEnvironment(scene, url("/hdr/lobby.hdr"), { intensity: 0.4 }),
  ]);

  // <Center>: measure the content once, as it stands at mount and relative to
  // its own origin, and shift it so its bounding box sits on the target point.
  const inner = new Group();
  inner.add(floating.group);
  inner.updateWorldMatrix(true, true);
  const middle = new Box3().setFromObject(inner, true).getCenter(new Vector3());
  inner.position.copy(middle).negate();

  const center = new Group();
  center.position.set(0, 0, 1.5);
  center.add(inner);
  scene.add(center);

  addCanLights(scene);

  // See the hero: compile and upload ahead of the first frame.
  await warmUp(scene, await labelTextures());

  const view = addView(el, scene);
  view.update = floating.update;

  return {
    /** The group the flavour-change spin animates. */
    spinTarget: floating.group,
    setFlavor: (next: Flavor) => floating.can.setFlavor(next),
  };
}
