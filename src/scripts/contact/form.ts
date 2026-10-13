/**
 * The Contact page's form, enhanced. Without this script the form still posts
 * to `/contact.php` and every fieldset shows; with it:
 *
 * - the query string (`?intent=bulk&product=pineapple`, built by
 *   `inquiryHref`) pre-fills the form, and the subject and message start from the
 *   matching template in `FORM_TEMPLATES` (config/contact.ts);
 * - only the fieldset for the selected inquiry type shows (the others are
 *   disabled too, so their values aren't sent);
 * - `[data-intent]` links on this page switch the form in place and scroll
 *   to it instead of reloading the page;
 * - the form sends with `fetch` and shows the thank-you in place.
 */

export function initContactForm() {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
  if (!form) return;

  const intent = form.querySelector<HTMLSelectElement>("[data-intent-select]")!;
  const groups = form.querySelectorAll<HTMLFieldSetElement>("fieldset[data-group]");
  const time = form.querySelector<HTMLInputElement>("[data-form-time]");
  if (time) time.value = String(Date.now());

  const showGroup = () => {
    groups.forEach((group) => {
      const active = group.dataset.group === intent.value;
      group.hidden = !active;
      group.disabled = !active;
    });
  };

  /** Select `value` in `select` if it's one of its options. */
  const choose = (select: HTMLSelectElement | null, value: string | null) => {
    if (!select || !value) return;
    if ([...select.options].some((o) => o.value === value)) select.value = value;
  };

  const params = new URLSearchParams(location.search);
  let names: Record<string, string> = {};
  try {
    names = JSON.parse(form.dataset.names ?? "{}");
  } catch {
    // Without names a mix can't be described, so no Mixed Pack Order.
  }
  // "Mixed Pack Order" is only offered to a visitor arriving with a built mix.
  const mixOk = describeMix(params.get("mix"), names) !== "";
  const linkOnly = intent.querySelector<HTMLOptionElement>("option[data-link-only]");
  if (linkOnly && mixOk) linkOnly.hidden = linkOnly.disabled = false;
  const wanted = params.get("intent");
  choose(intent, wanted === "mixed" && !mixOk ? "bulk" : wanted);
  showGroup();
  // A plain post that failed comes back with `?error=1` (see contact.php).
  if (params.has("error")) form.querySelector<HTMLElement>("[data-form-error]")!.hidden = false;

  const qty = params.get("quantity");
  const state = {
    topic: params.get("topic"),
    mix: params.get("mix"),
    product: params.get("product"),
    quantity: qty && /^[1-9]\d{0,4}$/.test(qty) ? qty : "1",
  };
  const applyTemplate = initTemplates(form, intent, names, state);
  intent.addEventListener("change", () => {
    showGroup();
    applyTemplate();
  });

  initIntentLinks(intent, (topic) => {
    showGroup();
    state.topic = topic;
    applyTemplate();
  });
  initCans(form);
  initSubmit(form);
}

/**
 * The bulk order's cans per flavour: − / + step one can, the number can be
 * typed too, and the total sits underneath, with a pointer to the Mixed Pack
 * for 6 cans or fewer (a bulk order is more than one pack).
 */
function initCans(form: HTMLFormElement) {
  const rows = [...form.querySelectorAll<HTMLElement>("[data-can-row]")];
  const total = form.querySelector<HTMLElement>("[data-can-total]");
  const small = form.querySelector<HTMLElement>("[data-can-small]");
  const inputs = rows.map((row) => row.querySelector<HTMLInputElement>("input")!);
  const max = (input: HTMLInputElement) => Number(input.max) || 99999;
  const count = (input: HTMLInputElement) =>
    Math.min(max(input), Math.max(0, Math.round(Number(input.value)) || 0));

  const render = () => {
    let sum = 0;
    rows.forEach((row, i) => {
      const n = count(inputs[i]);
      sum += n;
      const [less, more] = row.querySelectorAll<HTMLButtonElement>("[data-can-step]");
      less.disabled = n === 0;
      more.disabled = n >= max(inputs[i]);
    });
    if (total) total.textContent = `Total: ${sum} ${sum === 1 ? "can" : "cans"}`;
    if (small) small.hidden = sum === 0 || sum > 6;
  };

  rows.forEach((row, i) => {
    const input = inputs[i];
    row.querySelectorAll<HTMLButtonElement>("[data-can-step]").forEach((button) =>
      button.addEventListener("click", () => {
        input.value = String(
          Math.min(max(input), Math.max(0, count(input) + Number(button.dataset.canStep))),
        );
        render();
      }),
    );
    input.addEventListener("input", render);
    // Tidy what was typed (blank, negative, decimals) once the visitor moves on.
    input.addEventListener("change", () => {
      input.value = String(count(input));
      render();
    });
  });
  render();
}

type Template = { subject: string; message: string };

/**
 * Starts the subject and message from `FORM_TEMPLATES` (config/contact.ts,
 * passed in as `data-templates`), chosen by how the visitor got here: the
 * link's `topic`, else the inquiry type. The template follows the inquiry
 * type as it changes, but only while the visitor hasn't edited that field:
 * their own words are never replaced. A Mixed Pack order is the exception:
 * its subject and order summary are locked, and only the message is theirs.
 */
function initTemplates(
  form: HTMLFormElement,
  intent: HTMLSelectElement,
  names: Record<string, string>,
  state: { topic: string | null; mix: string | null; product: string | null; quantity: string },
) {
  const subject = form.querySelector<HTMLInputElement>("#cf-subject");
  const message = form.querySelector<HTMLTextAreaElement>("#cf-message");
  const order = form.querySelector<HTMLTextAreaElement>("#cf-order");
  const orderQty = form.querySelector<HTMLInputElement>("[data-order-quantity]");
  // The Mixed Pack's packs come from the link and are locked with the order.
  if (orderQty) orderQty.value = state.quantity;
  let templates: Record<string, Template> = {};
  try {
    templates = JSON.parse(form.dataset.templates ?? "{}");
  } catch {
    // No templates: the fields start empty, as without script.
  }
  // What the template last wrote, to tell untouched fields from edited ones.
  const written = { subject: "", message: "" };

  const pick = (): Template | undefined => {
    const type = intent.value;
    // A topic belongs to the type its link opened; switching type leaves it.
    const topicOf: Record<string, string> = { stockist: "general", review: "feedback" };
    if (state.topic && topicOf[state.topic] === type && templates[state.topic])
      return templates[state.topic];
    return templates[type];
  };

  const fill = (text: string) =>
    text
      .replaceAll("{product}", (state.product && names[state.product]) || "Thynkers Lyquid")
      .replaceAll("{quantity}", state.quantity)
      .replaceAll("{mix}", describeMix(state.mix, names));

  const apply = () => {
    const template = pick();
    if (!template) return;
    const locked = intent.value === "mixed";
    if (subject) subject.readOnly = locked;
    if (message)
      message.placeholder = locked
        ? "Where to deliver, when you need it, and anything else we should know."
        : "";
    if (locked) {
      // The order is fixed: its subject and summary always follow the template,
      // and the message is the visitor's own (delivery, timing, anything else).
      if (subject) subject.value = written.subject = fill(template.subject);
      if (order) order.value = fill(template.message);
      if (message && message.value === written.message) message.value = written.message = "";
      return;
    }
    for (const [field, key] of [
      [subject, "subject"],
      [message, "message"],
    ] as const) {
      if (!field || (field.value !== "" && field.value !== written[key])) continue;
      field.value = written[key] = fill(template[key]);
    }
  };

  apply();
  return apply;
}

/**
 * `matcha-original:2,pineapple:4` as one "- 2 × Matcha Original" line per
 * flavour. Anything malformed or unknown gives "".
 */
function describeMix(value: string | null, names: Record<string, string>) {
  if (!value) return "";
  const parts = value.split(",").map((part) => {
    const match = /^([a-z0-9-]+):([1-9]\d?)$/.exec(part);
    const name = match && names[match[1]];
    return name ? `- ${match[2]} × ${name}` : "";
  });
  return parts.every(Boolean) ? parts.join("\n") : "";
}

/** In-page "How can we help?" cards and other `[data-intent]` links. */
function initIntentLinks(intent: HTMLSelectElement, switched: (topic: string | null) => void) {
  const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("click", (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>("a[data-intent]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    const url = new URL(link.href);
    if (url.pathname !== location.pathname) return;

    event.preventDefault();
    const value = link.dataset.intent!;
    if (value !== "store") {
      intent.value = value;
      switched(url.searchParams.get("topic"));
    }
    history.replaceState(null, "", url.search + url.hash);

    const target = document.getElementById(url.hash.slice(1));
    target?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    // On the form, put the reader in its first field; elsewhere on the section.
    const focusable = value === "store" ? target : document.getElementById("cf-name");
    focusable?.focus({ preventScroll: true });
  });
}

function initSubmit(form: HTMLFormElement) {
  const button = form.querySelector<HTMLButtonElement>("[data-submit]")!;
  const error = form.querySelector<HTMLElement>("[data-form-error]")!;
  const success = document.querySelector<HTMLElement>("[data-form-success]")!;
  const label = button.textContent;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;
    button.disabled = true;
    button.textContent = "Sending…";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean };
      if (!response.ok || !result.ok) throw new Error(`Contact form: ${response.status}`);

      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      error.hidden = false;
      button.disabled = false;
      button.textContent = label;
    }
  });
}
