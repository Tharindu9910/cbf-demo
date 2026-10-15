import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { url } from "../../config/url";
import { COARSE_POINTER } from "./stage";

/**
 * The can: a bare aluminium model with no UVs, given a printed wrap at runtime.
 * A straight port of the Next build's `SodaCan.tsx`; every number below is
 * that file's, and so is the reasoning in the comments.
 *
 * The model is the real 250 ml slim can (51.0 mm x 130.5 mm, measured), in
 * metres and Y-up. The Next build's generic FBX is kept in
 * `backup/plain-aluminum-can/`.
 */

const MODEL_URL = url("/models/real_can_250ml.glb");

// Three products, three keys. The keys are the Next build's (they began life as
// Prismic select values), kept so the two code bases read the same.
const flavorTextures = {
  blackCherry: url("/labels/pineapple.webp"),
  grape: url("/labels/mango-passion.webp"),
  lemonLime: url("/labels/matcha-original.webp"),
};

export type Flavor = keyof typeof flavorTextures;

// World height of the normalised can. Every scene's scale values assume it.
const CAN_HEIGHT = 1.64;

// The wrap artwork carries the brand panel at its middle, so the seam lands at
// the back and the logo faces the camera.
const BRAND_FACING_Y = -Math.PI / 2;

const LABEL_MATERIAL_INDEX = 0;
const METAL_MATERIAL_INDEX = 1;

// The body is one glTF mesh with two primitives, which three splits into
// `Can_Mesh` (the drawn wall and base) and `Can_Mesh_1` (the lid end).
const BODY_NAME = "Can_Mesh";
const METAL_PART_NAMES = [
  "Can_Mesh_1",
  "Panel_Bead",
  "Pour_Score",
  "Rivet",
  "Tab",
] as const;

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
    // Touch devices draw the can small, so 4 taps is plenty there.
    map.anisotropy = COARSE_POINTER ? 4 : 8;
    // Triangles across the seam carry U past 1 (see `prepareBody`).
    map.wrapS = RepeatWrapping;
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

// The model is a bare can: aluminium materials and no UVs on the body. Wrap
// the printed area cylindrically (angle -> U, height -> V) so the label fills
// it edge to edge, and split the mesh so only that area takes the label — the
// base stays bare metal instead of smearing the artwork over it.
//
// The geometry is Y-up. The angle is measured as the FBX's was once its Z-up
// geometry had been stood upright, so the artwork faces the same way.
function prepareBody(source: BufferGeometry) {
  if (source.attributes.uv) return source;

  // Every triangle gets its own corners, so the seam can be closed per face.
  const geometry = source.index ? source.toNonIndexed() : source;
  const position = geometry.attributes.position;
  const radiusAt = (i: number) =>
    Math.hypot(position.getX(i), position.getZ(i));

  let maxRadius = 0;
  for (let i = 0; i < position.count; i++) {
    maxRadius = Math.max(maxRadius, radiusAt(i));
  }

  let wallTopY = -Infinity;
  for (let i = 0; i < position.count; i++) {
    if (radiusAt(i) < maxRadius * WALL_RADIUS) continue;
    wallTopY = Math.max(wallTopY, position.getY(i));
  }

  // Real cans print up over the shoulder, so the label has to carry past the
  // straight wall until the neck pulls in. Only the top is extended — the base
  // keeps its silver foot.
  const onLabel = (i: number) =>
    radiusAt(i) >= maxRadius * WALL_RADIUS ||
    (position.getY(i) > wallTopY && radiusAt(i) >= maxRadius * SHOULDER_RADIUS);

  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < position.count; i++) {
    if (!onLabel(i)) continue;
    minY = Math.min(minY, position.getY(i));
    maxY = Math.max(maxY, position.getY(i));
  }
  const labelHeight = maxY - minY;

  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    const angle = Math.atan2(-position.getZ(i), position.getX(i));
    uv[i * 2] = angle / (Math.PI * 2) + 0.5;
    uv[i * 2 + 1] = (position.getY(i) - minY) / labelHeight;
  }

  // A face straddling the seam has corners near U 1 and U 0, and would squeeze
  // the whole artwork into its width. Carry the low corners on past 1 instead.
  for (let vertex = 0; vertex < position.count; vertex += 3) {
    const us = [0, 1, 2].map((k) => uv[(vertex + k) * 2]);
    if (Math.max(...us) - Math.min(...us) < 0.5) continue;
    for (let k = 0; k < 3; k++) {
      if (us[k] < 0.5) uv[(vertex + k) * 2] += 1;
    }
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

  return geometry;
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
    const [gltf, ...textures] = await Promise.all([
      new GLTFLoader().loadAsync(MODEL_URL),
      ...Object.values(flavorTextures).map((url) => textureLoader.loadAsync(url)),
    ]);

    const can = gltf.scene;
    const nodes: Record<string, Mesh> = {};
    can.traverse((child) => {
      if ((child as Mesh).isMesh) nodes[child.name] = child as Mesh;
    });
    const body = nodes[BODY_NAME];
    body.geometry = prepareBody(body.geometry);

    // The can is authored standing on the origin, but every position in the
    // scenes assumes a can centred on it.
    can.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(can);
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
    // No shadow flags: nothing casts one, and the renderer's shadow map is
    // off (`stage.ts`). The floor shadows are `contactShadow` planes.
    const mesh = new Mesh(node.geometry, material);
    // Some parts sit inside a group (the lid is a child of `Can_Body`), so
    // take each part's full transform within the model, not just its own.
    node.matrixWorld.decompose(mesh.position, mesh.quaternion, mesh.scale);
    fitted.add(mesh);
    return mesh;
  };

  const body = place(nodes[BODY_NAME], [
    labelMaterialFor(labels[flavor]),
    metalMaterial,
  ]);
  for (const name of METAL_PART_NAMES) place(nodes[name], metalMaterial);

  root.setFlavor = (next) => {
    body.material = [labelMaterialFor(labels[next]), metalMaterial];
  };

  return root;
}
