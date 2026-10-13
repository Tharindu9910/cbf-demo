import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
} from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

/**
 * The can: a bare aluminium FBX with no UVs, given a printed wrap at runtime.
 * A straight port of the Next build's `SodaCan.tsx`; every number below is
 * that file's, and so is the reasoning in the comments.
 */

const MODEL_URL = "/models/plain_aluminum_can.fbx";

// Three products, three keys. The keys are the Next build's (they began life as
// Prismic select values), kept so the two code bases read the same.
const flavorTextures = {
  blackCherry: "/labels/pineapple.webp",
  grape: "/labels/mango-passion.webp",
  lemonLime: "/labels/matcha-original.webp",
};

export type Flavor = keyof typeof flavorTextures;

// World height of the normalised can. Every scene's scale values assume it.
const CAN_HEIGHT = 1.64;

// The wrap artwork carries the brand panel at its middle, so the seam lands at
// the back and the logo faces the camera.
const BRAND_FACING_Y = -Math.PI / 2;

const LABEL_MATERIAL_INDEX = 0;
const METAL_MATERIAL_INDEX = 1;

const METAL_PART_NAMES = ["Tab", "Tab_Rivet", "Lid_Score"] as const;

// Brushed aluminium for the lid, base, tab and score line — bright enough to
// read as silver against a dark backdrop rather than as flat grey.
const metalMaterial = new MeshStandardMaterial({
  roughness: 0.22,
  metalness: 1,
  color: "#e9e9ec",
  envMapIntensity: 1.6,
});

// One material per label image for the whole site, however often the flavour
// changes.
const labelMaterials = new WeakMap<Texture, MeshPhysicalMaterial>();

function labelMaterialFor(map: Texture) {
  let material = labelMaterials.get(map);

  if (!material) {
    // The artwork is sRGB; read as linear it lifts the midtones and fades.
    map.colorSpace = SRGBColorSpace;
    // The wrap is read at a slant almost everywhere; without this the printed
    // text turns to mush towards the edges of the can.
    map.anisotropy = 8;
    map.needsUpdate = true;

    material = new MeshPhysicalMaterial({
      map,
      // A printed label is a dielectric — high metalness would tint the
      // artwork with the environment and kill the colour. The gloss comes
      // from a clear lacquer coat over the print instead, like a real can.
      roughness: 0.32,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      // Held down so the bright environment lights the print without washing
      // the colour out.
      envMapIntensity: 0.6,
    });
    labelMaterials.set(map, material);
  }

  return material;
}

// Radii that bound the printed area, as a fraction of the can's widest point:
// the straight wall, and how far the print carries on up the narrowing
// shoulder above it.
const WALL_RADIUS = 0.985;
const SHOULDER_RADIUS = 0.935;

// The model is a bare can: a single aluminium material and no UVs at all. Wrap
// the printed area cylindrically (angle -> U, height -> V) so the label fills
// it edge to edge, and split the mesh so only that area takes the label — the
// lid and base stay bare metal instead of smearing the artwork over them.
function prepareBody(geometry: BufferGeometry) {
  if (geometry.attributes.uv) return;

  const position = geometry.attributes.position;
  const radiusAt = (i: number) =>
    Math.hypot(position.getX(i), position.getY(i));

  let maxRadius = 0;
  for (let i = 0; i < position.count; i++) {
    maxRadius = Math.max(maxRadius, radiusAt(i));
  }

  let wallTopZ = -Infinity;
  for (let i = 0; i < position.count; i++) {
    if (radiusAt(i) < maxRadius * WALL_RADIUS) continue;
    wallTopZ = Math.max(wallTopZ, position.getZ(i));
  }

  // Real cans print up over the shoulder, so the label has to carry past the
  // straight wall until the neck pulls in. Only the top is extended — the base
  // keeps its silver foot.
  const onLabel = (i: number) =>
    radiusAt(i) >= maxRadius * WALL_RADIUS ||
    (position.getZ(i) > wallTopZ && radiusAt(i) >= maxRadius * SHOULDER_RADIUS);

  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < position.count; i++) {
    if (!onLabel(i)) continue;
    minZ = Math.min(minZ, position.getZ(i));
    maxZ = Math.max(maxZ, position.getZ(i));
  }
  const labelHeight = maxZ - minZ;

  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    const angle = Math.atan2(position.getY(i), position.getX(i));
    uv[i * 2] = angle / (Math.PI * 2) + 0.5;
    uv[i * 2 + 1] = (position.getZ(i) - minZ) / labelHeight;
  }
  geometry.setAttribute("uv", new BufferAttribute(uv, 2));

  geometry.clearGroups();
  let groupStart = 0;
  let groupIndex = -1;
  for (let vertex = 0; vertex < position.count; vertex += 3) {
    const index =
      onLabel(vertex) && onLabel(vertex + 1) && onLabel(vertex + 2)
        ? LABEL_MATERIAL_INDEX
        : METAL_MATERIAL_INDEX;

    if (index === groupIndex) continue;
    if (groupIndex !== -1) {
      geometry.addGroup(groupStart, vertex - groupStart, groupIndex);
    }
    groupIndex = index;
    groupStart = vertex;
  }
  geometry.addGroup(groupStart, position.count - groupStart, groupIndex);
}

type CanModel = {
  nodes: Record<string, Mesh>;
  fit: { scale: number; offset: Vector3 };
  labels: Record<Flavor, Texture>;
};

let model: Promise<CanModel> | null = null;

/**
 * Load the model and every label once. All of it goes through three's default
 * loading manager, which is what the loading panel watches.
 */
export function loadCanModel() {
  model ??= (async () => {
    const textureLoader = new TextureLoader();
    const [fbx, ...textures] = await Promise.all([
      new FBXLoader().loadAsync(MODEL_URL),
      ...Object.values(flavorTextures).map((url) => textureLoader.loadAsync(url)),
    ]);

    const nodes: Record<string, Mesh> = {};
    fbx.traverse((child) => {
      if ((child as Mesh).isMesh) nodes[child.name] = child as Mesh;
    });
    prepareBody(nodes.Aluminium_Can.geometry);

    // The can is authored standing on the origin, but every position in the
    // scenes assumes a can centred on it.
    fbx.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(fbx);
    const scale = CAN_HEIGHT / bounds.getSize(new Vector3()).y;

    const labels = Object.fromEntries(
      Object.keys(flavorTextures).map((key, i) => [key, textures[i]]),
    ) as Record<Flavor, Texture>;

    return {
      nodes,
      fit: {
        scale,
        offset: bounds.getCenter(new Vector3()).multiplyScalar(-scale),
      },
      labels,
    };
  })();
  return model;
}

export type SodaCan = Group & { setFlavor(flavor: Flavor): void };

/**
 * A can, as `<SodaCan flavor>` rendered it: turned so the brand panel faces
 * the camera, normalised, its body wearing the flavour's label. Geometry is
 * shared between every can on the page; only the label material differs.
 */
export async function createSodaCan(flavor: Flavor): Promise<SodaCan> {
  const { nodes, fit, labels } = await loadCanModel();

  const root = new Group() as SodaCan;
  root.rotation.set(0, BRAND_FACING_Y, 0);

  const fitted = new Group();
  fitted.scale.setScalar(fit.scale);
  fitted.position.copy(fit.offset);
  root.add(fitted);

  const place = (node: Mesh, material: Mesh["material"]) => {
    const mesh = new Mesh(node.geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(node.position);
    mesh.rotation.copy(node.rotation);
    mesh.scale.copy(node.scale);
    fitted.add(mesh);
    return mesh;
  };

  const body = place(nodes.Aluminium_Can, [
    labelMaterialFor(labels[flavor]),
    metalMaterial,
  ]);
  for (const name of METAL_PART_NAMES) place(nodes[name], metalMaterial);

  root.setFlavor = (next) => {
    body.material = [labelMaterialFor(labels[next]), metalMaterial];
  };

  return root;
}
