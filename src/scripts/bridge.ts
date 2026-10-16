import type { Group } from "three";

/**
 * Hand-offs between the page's own scripts and the lazily loaded 3D chunk.
 * Each is a promise rather than an event, so it doesn't matter which side
 * arrives first.
 */

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

/** The hero's cans are placed: the hero copy may make its entrance. */
export const heroReady = deferred<void>();

/** The hero headline has landed: the 3D may load without delaying it. */
export const heroEntered = deferred<void>();

export type CarouselStage = {
  /** The group the flavour-change spin animates. */
  spinTarget: Group;
  setFlavor(key: string): void;
};

/** The carousel's can is on stage. */
export const carouselReady = deferred<CarouselStage>();
