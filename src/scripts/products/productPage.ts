/**
 * The product page's small behaviours. Each is an enhancement: without them
 * the gallery still swipes, the links still carry the first pack and the
 * reviews row still scrolls.
 */

const smooth = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches
    ? ("auto" as const)
    : ("smooth" as const);

/**
 * Thumbnails (and the phone's dots, a second set with the same indices) drive
 * the gallery's scroll-snap track, and follow it.
 */
export function initGallery() {
  for (const root of document.querySelectorAll<HTMLElement>("[data-gallery]")) {
    const track = root.querySelector<HTMLElement>("[data-gallery-track]");
    const thumbs = [
      ...root.querySelectorAll<HTMLButtonElement>("[data-gallery-thumb]"),
    ];
    if (!track || thumbs.length === 0) continue;

    const indexOf = (thumb: HTMLElement) => Number(thumb.dataset.galleryThumb);
    const mark = (index: number) =>
      thumbs.forEach((thumb) =>
        thumb.setAttribute("aria-current", String(indexOf(thumb) === index)),
      );

    thumbs.forEach((thumb) =>
      thumb.addEventListener("click", () => {
        const i = indexOf(thumb);
        track.scrollTo({ left: i * track.clientWidth, behavior: smooth() });
        mark(i);
      }),
    );

    let frame = 0;
    track.addEventListener(
      "scroll",
      () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() =>
          mark(Math.round(track.scrollLeft / track.clientWidth)),
        );
      },
      { passive: true },
    );
  }
}

/**
 * The pack choice rewrites the net-content fact and the Order Now link.
 * Choosing the Mixed Pack opens its builder; the mix rides on the order once
 * it adds up to the pack's can count, and Order Now waits until it does.
 */
export function initPackSelect() {
  const group =
    document.querySelector<HTMLFieldSetElement>("[data-pack-select]");
  if (!group) return;

  const builder = document.querySelector<HTMLElement>("[data-mix-builder]");
  const mixRadio = group.querySelector<HTMLInputElement>("input[data-mix]");
  const rows = builder
    ? [...builder.querySelectorAll<HTMLElement>("[data-mix-row]")]
    : [];
  const outputs = rows.map(
    (row) => row.querySelector<HTMLOutputElement>("[data-mix-count]")!,
  );
  const counts = outputs.map((out) => Number(out.textContent) || 0);
  const cans = Number(builder?.dataset.cans) || 0;
  const status = builder?.querySelector<HTMLElement>("[data-mix-status]");
  const summary = builder?.querySelector<HTMLElement>("[data-mix-summary]");
  const details = builder?.querySelector<HTMLDetailsElement>("[data-mix-details]");
  // On a flavour page the builder waits for its radio; on the pack's own page it's always open.
  const mixOn = () => !!builder && (mixRadio ? mixRadio.checked : true);

  const render = () => {
    const total = counts.reduce((sum, n) => sum + n, 0);
    rows.forEach((row, i) => {
      outputs[i].textContent = String(counts[i]);
      const [less, more] =
        row.querySelectorAll<HTMLButtonElement>("[data-mix-step]");
      less.disabled = counts[i] === 0;
      more.disabled = total >= cans;
    });
    if (status)
      status.textContent =
        total === cans
          ? `${cans} of ${cans} cans`
          : `${total} of ${cans} cans · add ${cans - total} more`;
    if (summary)
      summary.textContent =
        total === cans
          ? rows
              .map((row, i) => [row.dataset.name, counts[i]] as const)
              .filter(([, n]) => n > 0)
              .map(([name, n]) => `${n} ${name}`)
              .join(" · ")
          : `${total} of ${cans} cans chosen`;

    const on = mixOn();
    if (builder) builder.hidden = !on;
    // A built Mixed Pack is its own kind of enquiry, with its order locked in.
    if (builder) setOrderParam("intent", on ? "mixed" : "bulk");
    const chosen = group.querySelector<HTMLInputElement>('input[name="pack"]:checked');
    if (chosen) setOrderParam("pack", chosen.value);
    if (mixRadio)
      setOrderParam(
        "product",
        on ? mixRadio.dataset.product! : builder!.dataset.product!,
      );
    const ready = !on || total === cans;
    setOrderParam(
      "mix",
      on && ready
        ? rows
            .map((row, i) => [row.dataset.flavour, counts[i]] as const)
            .filter(([, n]) => n > 0)
            .map(([flavour, n]) => `${flavour}:${n}`)
            .join(",")
        : null,
    );
    document
      .querySelectorAll<HTMLAnchorElement>('a[data-inquiry="order"]')
      .forEach((link) =>
        ready
          ? link.removeAttribute("aria-disabled")
          : link.setAttribute("aria-disabled", "true"),
      );
  };

  rows.forEach((row, i) =>
    row
      .querySelectorAll<HTMLButtonElement>("[data-mix-step]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          const total = counts.reduce((sum, n) => sum + n, 0);
          const step = Number(button.dataset.mixStep);
          if (step > 0 && total >= cans) return;
          counts[i] = Math.max(0, counts[i] + step);
          render();
        }),
      ),
  );

  // An unfinished mix can't be sent.
  document
    .querySelectorAll<HTMLAnchorElement>('a[data-inquiry="order"]')
    .forEach((link) =>
      link.addEventListener("click", (event) => {
        if (link.getAttribute("aria-disabled") === "true") {
          event.preventDefault();
          if (details) details.open = true;
          status?.focus();
        }
      }),
    );

  group.addEventListener("change", (event) => {
    const input = event.target as HTMLInputElement;
    if (input.name !== "pack") return;

    document
      .querySelectorAll<HTMLElement>("[data-pack-detail]")
      .forEach((el) => {
        if (input.dataset.detail) el.textContent = input.dataset.detail;
      });
    setOrderParam("pack", input.value);
    render();
  });

  render();
}

/** The system share sheet where there is one; otherwise copy the link. */
export function initShare() {
  const button = document.querySelector<HTMLButtonElement>("[data-share]");
  const status = document.querySelector<HTMLElement>("[data-share-status]");
  if (!button) return;

  let timer = 0;
  const say = (message: string) => {
    if (!status) return;
    status.textContent = message;
    clearTimeout(timer);
    timer = window.setTimeout(() => (status.textContent = ""), 2400);
  };

  button.addEventListener("click", async () => {
    const data = {
      title: button.dataset.shareTitle ?? document.title,
      url: location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        // Dismissing the sheet rejects; nothing to report.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(data.url);
      say("Link copied");
    } catch {
      say("Couldn’t copy the link");
    }
  });
}

/** Sets `key` on the Order Now link's query, keeping the rest. */
function setOrderParam(key: string, value: string | null) {
  document
    .querySelectorAll<HTMLAnchorElement>('a[data-inquiry="order"]')
    .forEach((link) => {
      const url = new URL(link.href);
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
      link.href = url.pathname + url.search + url.hash;
    });
}

/** The − / + stepper; the quantity rides along on the order. */
export function initQuantity() {
  const root = document.querySelector<HTMLElement>("[data-quantity]");
  const input = root?.querySelector<HTMLInputElement>("input");
  if (!root || !input) return;

  const max = Number(input.max) || 99999;
  const commit = (value: number) => {
    const qty = Math.min(max, Math.max(1, Math.round(value) || 1));
    input.value = String(qty);
    setOrderParam("quantity", qty > 1 ? String(qty) : null);
  };

  root
    .querySelectorAll<HTMLButtonElement>("[data-quantity-step]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        commit(Number(input.value) + Number(button.dataset.quantityStep)),
      ),
    );
  input.addEventListener("change", () => commit(Number(input.value)));
}

/** The reviews row's arrows: a card's width per step, hidden while it all fits. */
export function initReviewRow() {
  const track = document.querySelector<HTMLElement>("[data-review-track]");
  const arrows = document.querySelector<HTMLElement>("[data-review-arrows]");
  if (!track || !arrows) return;
  const [prev, next] =
    arrows.querySelectorAll<HTMLButtonElement>("[data-review-step]");

  const update = () => {
    const overflow = track.scrollWidth - track.clientWidth > 2;
    arrows.hidden = !overflow;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled =
      track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  };

  arrows
    .querySelectorAll<HTMLButtonElement>("[data-review-step]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        const card = track.firstElementChild as HTMLElement | null;
        const step = (card?.offsetWidth ?? track.clientWidth) + 16;
        track.scrollBy({
          left: step * Number(button.dataset.reviewStep),
          behavior: smooth(),
        });
      }),
    );
  track.addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
}

/**
 * The phone's bottom Order Now bar: shown once the panel's buttons have
 * scrolled up out of view, and put away again while the closing BuyStrip is
 * on screen, so there's only ever one way to order in sight.
 */
export function initStickyBuy() {
  const bar = document.querySelector<HTMLElement>("[data-sticky-buy]");
  const anchor = document.querySelector<HTMLElement>("[data-buy-anchor]");
  const end = document.querySelector<HTMLElement>("[data-buy-end]");
  if (!bar || !anchor) return;

  // Start from the panel's Order Now; setOrderParam keeps the two in step.
  const from = anchor.querySelector<HTMLAnchorElement>('a[data-inquiry="order"]');
  const to = bar.querySelector<HTMLAnchorElement>('a[data-inquiry="order"]');
  if (from && to) to.href = from.getAttribute("href")!;

  let passed = false;
  let atEnd = false;
  const update = () => {
    const show = passed && !atEnd;
    bar.classList.toggle("translate-y-full", !show);
    bar.toggleAttribute("inert", !show);
    if (show) bar.removeAttribute("aria-hidden");
    else bar.setAttribute("aria-hidden", "true");
  };

  // Each root reaches far past one edge, so its observer turns on a single
  // line a fast fling can't jump over: the anchor leaving the top, the strip
  // reaching the bottom (and staying "reached" below it).
  const far = "100000px";
  new IntersectionObserver(
    ([entry]) => {
      passed = !entry.isIntersecting;
      update();
    },
    { rootMargin: `0px 0px ${far} 0px` },
  ).observe(anchor);

  if (end)
    new IntersectionObserver(
      ([entry]) => {
        atEnd = entry.isIntersecting;
        update();
      },
      { rootMargin: `${far} 0px 0px 0px` },
    ).observe(end);
}
