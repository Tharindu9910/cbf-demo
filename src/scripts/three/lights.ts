import { AmbientLight, DirectionalLight, type Scene } from "three";

/**
 * The rig the hero and the carousel share, so the can doesn't change character
 * between the two sections.
 *
 * A flat ambient fill carries the print without adding a highlight; two soft
 * white directionals give the white light, kept low enough not to clip into a
 * hot streak; the environment (applied separately) is held well below 1 for
 * the same reason.
 */
export function addCanLights(scene: Scene) {
  scene.add(new AmbientLight(0xffffff, 1.4));

  const key = new DirectionalLight("#ffffff", 0.9);
  key.position.set(3, 4, 6);
  scene.add(key);

  const fill = new DirectionalLight("#ffffff", 0.45);
  fill.position.set(-5, 2, 3);
  scene.add(fill);
}
