import { prisma } from "@/lib/prisma";
import { INTEREST_CATALOG } from "@/lib/interest-catalog";

export { INTEREST_CATALOG } from "@/lib/interest-catalog";
export type { InterestSlug } from "@/lib/interest-catalog";

const CATALOG_SLUGS = new Set<string>(INTEREST_CATALOG.map((i) => i.slug));
const LABEL_BY_SLUG = new Map<string, string>(
  INTEREST_CATALOG.map((i) => [i.slug, i.label]),
);

/** Keep only slugs that exist in the catalog, de-duplicated and capped. */
export function sanitizeInterestSlugs(slugs: string[], max = 10): string[] {
  const seen = new Set<string>();
  for (const slug of slugs) {
    if (CATALOG_SLUGS.has(slug)) seen.add(slug);
    if (seen.size >= max) break;
  }
  return [...seen];
}

/**
 * Make sure an Interest row exists for every catalog slug passed in, then return
 * their ids. Idempotent — safe to call on every save.
 */
export async function ensureInterests(slugs: string[]): Promise<{ id: string }[]> {
  const valid = sanitizeInterestSlugs(slugs);
  if (valid.length === 0) return [];

  await Promise.all(
    valid.map((slug) =>
      prisma.interest.upsert({
        where: { slug },
        update: {},
        create: { slug, label: LABEL_BY_SLUG.get(slug) ?? slug },
      }),
    ),
  );

  return prisma.interest.findMany({
    where: { slug: { in: valid } },
    select: { id: true },
  });
}

/** Slugs the given user has selected. */
export async function getUserInterestSlugs(userId: string): Promise<string[]> {
  const rows = await prisma.interest.findMany({
    where: { users: { some: { id: userId } } },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

/** Replace a user's interests with exactly the given catalog slugs. */
export async function setUserInterests(
  userId: string,
  slugs: string[],
): Promise<string[]> {
  const interests = await ensureInterests(slugs);
  await prisma.user.update({
    where: { id: userId },
    data: { interests: { set: interests.map((i) => ({ id: i.id })) } },
  });
  return sanitizeInterestSlugs(slugs);
}
