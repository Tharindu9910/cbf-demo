import { DefaultLoadingManager } from "three";

/**
 * drei's `<Loader />`, without React: a dark full-screen panel with a thin
 * progress bar, driven by three's `DefaultLoadingManager` — which every loader
 * in this project reports to, as R3F's did.
 *
 * The timing is drei's too. The panel only appears once loading has been
 * running for 300ms, so a warm cache never flashes it, and it fades over
 * 300ms once everything is in.
 */

const SHOW_DELAY = 300;

export function mountLoader() {
  // Absolutely positioned against the initial containing block, so it covers
  // the first screen and scrolls away with it.
  const root = document.createElement("div");
  root.className =
    "absolute inset-0 z-1000 flex items-center justify-center bg-loader-ground transition-opacity duration-300 ease-[ease]";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML =
    '<div><div class="h-[3px] w-[100px] bg-loader-track text-center">' +
    // `transform`, not `scale-x-0`: render() writes the progress to `transform`.
    '<div class="h-[3px] w-full origin-left transform-[scaleX(0)] bg-white transition-transform duration-200 ease-[ease]" data-bar></div>' +
    '<span class="relative mt-[0.8em] inline-block font-system text-[0.6em] whitespace-nowrap text-loader-text tabular-nums" data-readout></span>' +
    "</div></div>";

  const bar = root.querySelector<HTMLElement>("[data-bar]")!;
  const data = root.querySelector<HTMLElement>("[data-readout]")!;

  let active = false;
  let shown = false;
  let progress = 0;
  let displayed = 0;
  let toggle = 0;
  let raf = 0;

  const render = () => {
    root.style.opacity = active ? "1" : "0";
    bar.style.transform = `scaleX(${progress / 100})`;
  };

  // The readout eases towards the real figure, as drei's does.
  const tickReadout = () => {
    displayed += (progress - displayed) / 2;
    if (displayed > 0.95 * progress || progress === 100) displayed = progress;
    data.textContent = `Loading ${displayed.toFixed(2)}%`;
    if (displayed < progress) raf = requestAnimationFrame(tickReadout);
  };

  const sync = () => {
    clearTimeout(toggle);
    if (active !== shown) {
      toggle = window.setTimeout(() => {
        shown = active;
        if (shown) document.body.appendChild(root);
        else root.remove();
      }, SHOW_DELAY);
    }
    render();
    cancelAnimationFrame(raf);
    tickReadout();
  };

  DefaultLoadingManager.onStart = (_url, loaded, total) => {
    active = true;
    progress = (loaded / total) * 100;
    sync();
  };
  DefaultLoadingManager.onProgress = (_url, loaded, total) => {
    progress = (loaded / total) * 100;
    sync();
  };
  DefaultLoadingManager.onLoad = () => {
    active = false;
    progress = 100;
    sync();
  };
  DefaultLoadingManager.onError = () => {
    active = false;
    sync();
  };
}
