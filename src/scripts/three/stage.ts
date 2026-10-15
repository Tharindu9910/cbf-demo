import {
  NeutralToneMapping,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Timer,
  WebGLRenderer,
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
const views: View[] = [];
const timer = new Timer();
let running = false;
let size = { width: 0, height: 0 };

/**
 * Phones and tablets. They draw the cans smaller, on hotter, battery-bound
 * GPUs, so they skip MSAA (DPR already smooths the edges) and get a lower
 * pixel-ratio cap.
 */
export const COARSE_POINTER = matchMedia("(pointer: coarse)").matches;

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

export function createStage(host: HTMLElement) {
  if (renderer) return renderer;

  renderer = new WebGLRenderer({
    antialias: !COARSE_POINTER,
    alpha: true,
    powerPreference: "high-performance",
  });
  // R3F's `dpr={[1, 1.5]}`; 1.25 on touch screens, whose 2-3x displays would
  // otherwise fill a whole-screen canvas at desktop cost.
  const maxDpr = COARSE_POINTER ? 1.25 : 1.5;
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, 1), maxDpr));
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

  const measure = () => {
    size = { width: host.clientWidth, height: host.clientHeight };
    renderer!.setSize(size.width, size.height, false);
  };
  measure();
  new ResizeObserver(measure).observe(host);

  timer.connect(document);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  return renderer;
}

export function getRenderer() {
  if (!renderer) throw new Error("createStage() must run first");
  return renderer;
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

/**
 * One frame: clear once, then draw each on-screen view into its own rectangle
 * — drei's `View` render path, with the canvas at the top-left of the window.
 */
function frame(time: number) {
  if (!renderer) return;
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
