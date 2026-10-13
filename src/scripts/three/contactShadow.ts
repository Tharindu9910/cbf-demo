import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from "three";

/**
 * A soft blob shadow on an imaginary floor under a floating can: a flat plane
 * with a radial falloff, rather than a real shadow map. Nothing in these scenes
 * has a floor to receive one, and a blob reads better against the cream runway
 * than a hard cast shadow would.
 *
 * The plane lies flat and the camera sees it at a grazing angle, so it lands
 * on screen as a thin ellipse without being squashed by hand.
 */
export type ContactShadow = {
  mesh: Mesh;
  /** 0–1, how present the shadow is overall — the scene tweens this in. */
  presence: number;
  /**
   * Size the shadow for a can of this world width, then call once per frame
   * with how high the can is in its float (0 lowest, 1 highest).
   */
  setWidth(width: number): void;
  update(lift: number): void;
};

/** Warm near-black, so the shadow sits in the cream instead of greying it. */
const SHADOW_RGB = "62, 44, 18";
const MAX_OPACITY = 0.55;

let texture: CanvasTexture | null = null;

function shadowTexture() {
  if (texture) return texture;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, `rgba(${SHADOW_RGB}, 1)`);
  gradient.addColorStop(0.35, `rgba(${SHADOW_RGB}, 0.6)`);
  gradient.addColorStop(1, `rgba(${SHADOW_RGB}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createContactShadow(): ContactShadow {
  const material = new MeshBasicMaterial({
    map: shadowTexture(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new Mesh(new PlaneGeometry(1, 1), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = -1;

  let baseWidth = 1;

  const shadow: ContactShadow = {
    mesh,
    presence: 0,
    setWidth(width) {
      // Wider than the can, so the falloff spreads past its base.
      baseWidth = width * 1.9;
    },
    update(lift) {
      // A can that rises casts a smaller, fainter shadow.
      const spread = baseWidth * (1 - 0.18 * lift);
      mesh.scale.set(spread, spread, 1);
      material.opacity = MAX_OPACITY * shadow.presence * (1 - 0.4 * lift);
      mesh.visible = material.opacity > 0.001;
    },
  };
  return shadow;
}
