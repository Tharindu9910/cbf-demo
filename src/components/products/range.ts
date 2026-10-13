import { getCollection, type CollectionEntry } from "astro:content";
import { url } from "../../config/url";

export type Product = CollectionEntry<"flavours">;

/** The whole range in shelf order: the flavours, then the packs. */
export async function getRange(): Promise<Product[]> {
  return (await getCollection("flavours")).sort(
    (a, b) =>
      Number(a.data.kind === "pack") - Number(b.data.kind === "pack") ||
      a.data.order - b.data.order,
  );
}

export const productHref = (id: string) => url(`/products/${id}/`);
