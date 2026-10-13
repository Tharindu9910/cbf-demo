import {
  NeutralToneMapping,
  PCFShadowMap,
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
};

let renderer: WebGLRenderer | null = null;
const views: View[] = [];
const timer = new Timer();
let running = false;
let size = { width: 0, height: 0 };

/** Listeners for viewport-size changes on any view, keyed by view. */
const resizeListeners = new Map<View, Set<() => void>>();

export function createStage(host: HTMLElement) {
  if (renderer) return renderer;

  renderer = new WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  // R3F's `dpr={[1, 1.5]}`.
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, 1), 1.5));
  renderer.outputColorSpace = SRGBColorSpace;
  // R3F defaults to ACES Filmic, which desaturates as it rolls off and left the
  // printed labels looking washed out. Khronos PBR Neutral holds the colour.
  renderer.toneMapping = NeutralToneMapping;
  // `shadows` on the R3F canvas. No light in these scenes casts one, so this
  // only keeps the renderer state the same.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;

  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

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
  start();
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
  if (running || document.hidden || !renderer) return;
  running = true;
  renderer.setAnimationLoop(frame);
}

function stop() {
  running = false;
  renderer?.setAnimationLoop(null);
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
    renderer.setViewport(rect.left, bottom, rect.width, rect.height);
    renderer.setScissor(rect.left, bottom, rect.width, rect.height);
    renderer.setScissorTest(true);
    renderer.render(view.scene, view.camera);
  }

  renderer.setScissorTest(false);
}
