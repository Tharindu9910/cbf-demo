/**
 * The Products listing's filter pills. Each `[data-filter]` button shows the
 * items whose `data-<key>` matches it ("all" shows every one) and says how
 * many in `[data-filter-count]`, if there is one. Items without the attribute,
 * like the promises panel, always stay. Without JavaScript the pills are
 * hidden and everything shows.
 *
 * `key` is `category` for products in a grid, `group` for whole collections.
 */
export function initFilter(root: HTMLElement, key = "category") {
  const buttons = [
    ...root.querySelectorAll<HTMLButtonElement>("[data-filter]"),
  ];
  const items = [...root.querySelectorAll<HTMLElement>(`[data-${key}]`)];
  const count = root.querySelector<HTMLElement>("[data-filter-count]");

  const apply = (filter: string) => {
    let shown = 0;
    for (const item of items) {
      const match = filter === "all" || item.dataset[key] === filter;
      item.hidden = !match;
      if (match) shown++;
    }
    for (const button of buttons)
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === filter),
      );
    if (count)
      count.textContent = `Showing ${shown} product${shown === 1 ? "" : "s"}`;
  };

  for (const button of buttons)
    button.addEventListener("click", () =>
      apply(button.dataset.filter ?? "all"),
    );
}
