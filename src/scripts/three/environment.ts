import { EquirectangularReflectionMapping, Euler, type Scene, type Texture } from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";

/**
 * drei's `<Environment files>`: load an equirectangular HDR and hand it to the
 * scene as its environment. The renderer turns it into a PMREM itself, exactly
 * as it did under R3F. Loaded once and shared — each view only differs in how
 * strongly, and at what angle, it applies it.
 */
const cache = new Map<string, Promise<Texture>>();

function loadHdr(url: string) {
  let texture = cache.get(url);
  if (!texture) {
    texture = new HDRLoader().loadAsync(url).then((t) => {
      t.mapping = EquirectangularReflectionMapping;
      return t;
    });
    cache.set(url, texture);
  }
  return texture;
}

export async function applyEnvironment(
  scene: Scene,
  url: string,
  { intensity = 1, rotation = [0, 0, 0] as [number, number, number] } = {},
) {
  scene.environment = await loadHdr(url);
  scene.environmentIntensity = intensity;
  scene.environmentRotation = new Euler(...rotation);
}
