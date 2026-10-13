import { getCollection } from "astro:content";

import { SHOW_PLACEHOLDER_REVIEWS } from "../../config/products";

/**
 * One product's visible reviews from `content/reviews`, with their average
 * and how many gave each star. Sample quotes (`placeholder`) count only in
 * development (see `SHOW_PLACEHOLDER_REVIEWS`), so in a build a product has
 * none until real reviews exist, and everything built on them is hidden.
 */
export async function getReviews(productId: string) {
  const reviews = (await getCollection("reviews"))
    .map((entry) => entry.data)
    .filter(
      (r) =>
        r.flavour.id === productId &&
        (SHOW_PLACEHOLDER_REVIEWS || !r.placeholder),
    )
    .sort((a, b) => a.order - b.order);

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  /** Five rows, 5 stars first: the star, its count and its share of all reviews. */
  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
    return { stars, count, share: reviews.length ? count / reviews.length : 0 };
  });

  return { reviews, average, breakdown };
}

/** The star outline both the summary and the cards draw. */
export const STAR_PATH =
  "M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z";
