/**
 * The fixed catalog of interests users can pick from. Kept in its own module —
 * with no server-only imports — so client components (the chip picker) can read
 * it directly without pulling Prisma into the browser bundle.
 *
 * Slugs are stable identifiers — never rename one, only add or relabel.
 */
export const INTEREST_CATALOG = [
  { slug: "technology", label: "Technology" },
  { slug: "programming", label: "Programming" },
  { slug: "design", label: "Design" },
  { slug: "startups", label: "Startups" },
  { slug: "science", label: "Science" },
  { slug: "gaming", label: "Gaming" },
  { slug: "music", label: "Music" },
  { slug: "movies", label: "Movies & TV" },
  { slug: "books", label: "Books" },
  { slug: "art", label: "Art" },
  { slug: "photography", label: "Photography" },
  { slug: "food", label: "Food" },
  { slug: "travel", label: "Travel" },
  { slug: "fitness", label: "Fitness" },
  { slug: "sports", label: "Sports" },
  { slug: "fashion", label: "Fashion" },
  { slug: "business", label: "Business" },
  { slug: "finance", label: "Finance" },
  { slug: "writing", label: "Writing" },
  { slug: "news", label: "News & Politics" },
  { slug: "nature", label: "Nature & Outdoors" },
  { slug: "pets", label: "Pets" },
] as const;

export type InterestSlug = (typeof INTEREST_CATALOG)[number]["slug"];
