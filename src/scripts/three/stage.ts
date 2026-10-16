import {
  NeutralToneMapping,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Timer,
  WebGLRenderer,
  type Texture,
} from "three";

/**
 * The one WebGL canvas for the whole site, and the views drawn into it.
 *
 * This is the Next build's `ViewCanvas` + drei `<View>` without React: a
 * section never owns a canvas, it owns a DOM box (`[data-view]`), and every
 * frame the stage draws that section's scene clipped to the box's rectangle on
 * screen. Layout and scroll position of the 3D therefore come from CSS on the
 * box, exactly as before.
 */

/** R3F's default camera: fov 30 as configured, at z 5. */
const FOV = 30;
const CAMERA_Z = 5;

/** The most pixels the canvas's drawing buffer may hold: about one 4K screen at 1x. */
const MAX_BUFFER_PIXELS = 3840 * 2160;

/** World height of the frame at z 0 — what R3F reports as `viewport.height`. */
const FRAME_HEIGHT = 2 * Math.tan(((FOV / 2) * Math.PI) / 180) * CAMERA_Z;

export type View = {
  el: HTMLElement;
  scene: Scene;
  camera: PerspectiveCamera;
  /** World size of the view's frame at z 0 — R3F's `useThree().viewport`. */
  viewport: { width: number; height: number };
  /** Called once per frame before the view renders, with elapsed seconds. */
  update?: (elapsed: number) => void;
  /**
   * Draw the scene this many CSS pixels higher than the box, clipped to the
   * box — a flat 2D shift, as if the picture were scrolled with the page.
   */
  offsetY?: number;
};

let renderer: WebGLRenderer | null = null;
let host: HTMLElement | null = null;
const views: View[] = [];
const timer = new Timer();
let running = false;
let size = { width: 0, height: 0 };

/**
 * Phones and tablets. Their screens are 2-3x, so the canvas is capped at 2x
 * there rather than desktop's 1.5x: below that the printed labels visibly
 * soften and the rims step.
 */
export const COARSE_POINTER = matchMedia("(pointer: coarse)").matches;

/**
 * The highest DPR the canvas may use: 2 on touch screens, 1.5 elsewhere (see
 * `createStage`). `adapt` lowers it a step at a time on a device that can't
 * hold the frame rate, down to `MIN_DPR`; it never climbs back within a page.
 */
let dprCap = COARSE_POINTER ? 2 : 1.5;
const MIN_DPR = 1;
const DPR_STEP = 0.25;

/** Views whose box is on (or about to come on) screen; the loop runs only while one is. */
const visible = new Set<Element>();
let contextLost = false;

const visibility = new IntersectionObserver(
  (entries) => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) visible.add(target);
      else visible.delete(target);
    }
    if (visible.size) start();
    else stop();
  },
  // A little early, so a scene is already drawing as it scrolls into view.
  { rootMargin: "15% 0px" },
);

/** Listeners for viewport-size changes on any view, keyed by view. */
const resizeListeners = new Map<View, Set<() => void>>();

export function createStage(el: HTMLElement) {
  if (renderer) return renderer;
  host = el;

  renderer = new WebGLRenderer({
    // MSAA everywhere: phone GPUs are tile-based and resolve it on-chip, so
    // it costs little, and without it the can rims crawl as they spin.
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  // R3F's `dpr={[1, 1.5]}`; 2 on touch screens, whose 2-3x displays show
  // anything less as blur. Not 3: only the scissored views are drawn, but a
  // 3x whole-screen buffer is still more memory than iOS likes to give.
  // (`dprCap`, lowered by `adapt` on a phone that can't keep up.)
  renderer.outputColorSpace = SRGBColorSpace;
  // R3F defaults to ACES Filmic, which desaturates as it rolls off and left the
  // printed labels looking washed out. Khronos PBR Neutral holds the colour.
  renderer.toneMapping = NeutralToneMapping;
  // No shadow map: no light in these scenes casts one (the floor shadows are
  // `contactShadow` planes), and it costs a pass on every frame.
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;

  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  // iOS drops WebGL contexts under memory pressure or after the tab has been
  // in the background. Ask for it back, and hold the loop until it returns;
  // three re-uploads the meshes and textures itself.
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    contextLost = true;
    stop();
  });
  canvas.addEventListener("webglcontextrestored", () => {
    contextLost = false;
    start();
  });

  measure();
  new ResizeObserver(measure).observe(el);

  timer.connect(document);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  return renderer;
}

function measure() {
  if (!renderer || !host) return;
  size = { width: host.clientWidth, height: host.clientHeight };
  // The canvas covers the whole window, so on a large monitor even 1.5x is
  // a huge buffer (5760x3240 on 4K). Hold it to about a 4K screen's worth
  // of pixels; laptops and phones are far under that and keep their DPR.
  const budget = Math.sqrt(MAX_BUFFER_PIXELS / Math.max(1, size.width * size.height));
  renderer.setPixelRatio(Math.max(1, Math.min(window.devicePixelRatio, dprCap, budget)));
  renderer.setSize(size.width, size.height, false);
}

export function getRenderer() {
  if (!renderer) throw new Error("createStage() must run first");
  return renderer;
}

/**
 * Compile a scene's shaders, build its environment's PMREM and upload its
 * textures before it goes on screen. Left to the first frame, all of that
 * lands in one frame: on a phone a stall of a few hundred milliseconds, which
 * swallows the start of the hero's entrance. `compileAsync` lets the driver
 * compile in the background where it can (KHR_parallel_shader_compile).
 */
export async function warmUp(scene: Scene, textures: Iterable<Texture> = []) {
  const r = getRenderer();
  for (const texture of textures) r.initTexture(texture);
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 1000);
  camera.position.set(0, 0, CAMERA_Z);
  await r.compileAsync(scene, camera);
}

/**
 * Register a DOM box as a view. The camera matches R3F's default — fov 30,
 * near 0.1, far 1000, at z 5 — and its aspect follows the box.
 */
export function addView(el: HTMLElement, scene: Scene): View {
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 1000);
  camera.position.set(0, 0, CAMERA_Z);

  const view: View = { el, scene, camera, viewport: { width: 0, height: 0 } };
  measureView(view);

  new ResizeObserver(() => {
    const before = view.viewport.width;
    measureView(view);
    if (view.viewport.width !== before) {
      resizeListeners.get(view)?.forEach((fn) => fn());
    }
  }).observe(el);

  views.push(view);
  visibility.observe(el);
  return view;
}

/** Subscribe to a view's frame changing size. Returns an unsubscribe. */
export function onViewResize(view: View, fn: () => void) {
  let set = resizeListeners.get(view);
  if (!set) resizeListeners.set(view, (set = new Set()));
  set.add(fn);
  return () => set!.delete(fn);
}

function measureView(view: View) {
  const { width, height } = view.el.getBoundingClientRect();
  const aspect = height > 0 ? width / height : 0;
  view.viewport = { width: FRAME_HEIGHT * aspect, height: height > 0 ? FRAME_HEIGHT : 0 };
}

function start() {
  if (running || document.hidden || contextLost || !renderer || !visible.size) return;
  running = true;
  // A restarted loop's first frames carry the gap and any catch-up work.
  lastFrame = 0;
  settleUntil = performance.now() + SETTLE_MS;
  renderer.setAnimationLoop(frame);
}

/** Park the loop. The last frame is wiped so no stale can is left on screen. */
function stop() {
  if (!running) return;
  running = false;
  renderer?.setAnimationLoop(null);
  if (renderer && !contextLost) {
    renderer.setScissorTest(false);
    renderer.clear(true, true);
  }
}

// ---- Adaptive resolution ----
//
// Fill rate is what a phone runs out of here: a full-window canvas at 2x with
// MSAA, and clear-coated cans covering much of a portrait screen. When the
// frames come in well behind the display's rate for a second at a time, drop
// the DPR a step. Each step costs one buffer reallocation (a single hitch), so
// it only ever steps down.

/** Frames per verdict. */
const SAMPLE_FRAMES = 60;
/** Ignore frame times for this long after the loop starts or the DPR changes. */
const SETTLE_MS = 1500;
/** Average frame time, against the target interval, that counts as struggling. */
const SLOW = 1.3;

let lastFrame = 0;
let settleUntil = 0;
let shortest = Infinity;
let sampleSum = 0;
let sampleCount = 0;

function adapt(time: number) {
  const delta = time - lastFrame;
  lastFrame = time;
  // Gaps (a parked loop, a backgrounded tab) and the settling window say
  // nothing about how fast the GPU draws.
  if (delta <= 0 || delta > 100 || time < settleUntil || dprCap <= MIN_DPR) return;

  shortest = Math.min(shortest, delta);
  sampleSum += delta;
  if (++sampleCount < SAMPLE_FRAMES) return;

  const average = sampleSum / sampleCount;
  sampleSum = sampleCount = 0;
  // The display's interval, but never asking more than 60fps: a 120Hz phone
  // holding 60 is fine and keeps its resolution.
  const target = Math.max(shortest, 1000 / 60);
  if (average < target * SLOW) return;

  dprCap = Math.max(MIN_DPR, dprCap - DPR_STEP);
  settleUntil = time + SETTLE_MS;
  measure();
}

/**
 * One frame: clear once, then draw each on-screen view into its own rectangle
 * — drei's `View` render path, with the canvas at the top-left of the window.
 */
function frame(time: number) {
  if (!renderer) return;
  adapt(time);
  timer.update(time);
  const elapsed = timer.getElapsed();

  renderer.setScissorTest(false);
  renderer.clear(true, true);

  for (const view of views) {
    const rect = view.el.getBoundingClientRect();
    const offscreen =
      rect.bottom < 0 ||
      rect.top > size.height ||
      rect.right < 0 ||
      rect.left > size.width;
    if (offscreen || rect.width === 0 || rect.height === 0) continue;

    view.update?.(elapsed);

    const aspect = rect.width / rect.height;
    if (view.camera.aspect !== aspect) {
      view.camera.aspect = aspect;
      view.camera.updateProjectionMatrix();
    }

    const bottom = size.height - rect.bottom;
    renderer.setViewport(rect.left, bottom + (view.offsetY ?? 0), rect.width, rect.height);
    renderer.setScissor(rect.left, bottom, rect.width, rect.height);
    renderer.setScissorTest(true);
    renderer.render(view.scene, view.camera);
  }

  renderer.setScissorTest(false);
}
