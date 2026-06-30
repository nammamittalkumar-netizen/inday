import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Mirrors the catalog in lib/interests.ts. Kept inline so the seed stays a
// standalone script (no path-alias resolution under tsx).
const INTEREST_CATALOG: { slug: string; label: string }[] = [
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
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  // Upsert the interest catalog (kept across reseeds; users get cleared below).
  for (const { slug, label } of INTEREST_CATALOG) {
    await prisma.interest.upsert({
      where: { slug },
      update: { label },
      create: { slug, label },
    });
  }

  // Idempotent: clear existing demo data first.
  await prisma.follow.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // Demo images live on Cloudinary's public "demo" cloud so they render
  // without any account configured.
  const ada = await prisma.user.create({
    data: {
      name: "Ada Lovelace",
      email: "ada@example.com",
      passwordHash,
      // Seed admin — sign in as ada@example.com / password123 to reach /admin.
      role: "ADMIN",
      bio: "First programmer, frequent victim of office machinery.",
      image: "https://res.cloudinary.com/demo/image/upload/woman.jpg",
      interests: {
        connect: [
          { slug: "programming" },
          { slug: "science" },
          { slug: "writing" },
        ],
      },
    },
  });

  const grace = await prisma.user.create({
    data: {
      name: "Grace Hopper",
      email: "grace@example.com",
      passwordHash,
      bio: "Debugging since before it was cool. Found the original bug.",
      image: "https://res.cloudinary.com/demo/image/upload/lady.jpg",
      interests: {
        connect: [
          { slug: "programming" },
          { slug: "technology" },
          { slug: "science" },
        ],
      },
    },
  });

  const incidents: { author: string; body: string; imageUrl?: string }[] = [
    {
      author: ada.id,
      body: "Spilled coffee directly onto my keyboard during the morning standup. The 'C' key now demands tribute before it responds.",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    },
    {
      author: grace.id,
      body: "Found a literal moth in the server room today. Logged it, taped it to my notebook, and called it a bug. History repeats itself.",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/butterfly.jpg",
    },
    {
      author: ada.id,
      body: "Tried to merge two branches and somehow created a third one out of pure spite. Git is a state of mind.",
    },
    {
      author: grace.id,
      body: "The vending machine ate my last dollar and gave me a bag of air with three chips in it. Filed an incident report. Pending.",
    },
    {
      author: ada.id,
      body: "Spent two hours debugging only to discover the server was never turned on. The server. Was never. Turned on.",
    },
    {
      author: grace.id,
      body: "Accidentally replied-all to a company-wide email with just the word 'why'. Surprisingly, 14 people replied 'same'.",
    },
    {
      author: ada.id,
      body: "My standing desk decided to descend mid-call, slowly lowering me out of frame like a magician's disappearing act.",
    },
    {
      author: grace.id,
      body: "Locked myself out of the office and had to wave at my own laptop through the window while it ran my unsaved work.",
    },
  ];

  // Insert posts sequentially so createdAt is naturally ordered.
  const created = [];
  for (const incident of incidents) {
    const post = await prisma.post.create({
      data: {
        body: incident.body,
        authorId: incident.author,
        imageUrl: incident.imageUrl ?? null,
      },
    });
    created.push(post);
    // small spacing between timestamps
    await new Promise((r) => setTimeout(r, 5));
  }

  // A few comments.
  await prisma.comment.create({
    data: {
      body: "This is painfully relatable.",
      authorId: grace.id,
      postId: created[0]!.id,
    },
  });
  await prisma.comment.create({
    data: {
      body: "The original bug! Iconic.",
      authorId: ada.id,
      postId: created[1]!.id,
    },
  });

  // A few likes (respecting the unique constraint).
  await prisma.like.create({
    data: { userId: grace.id, postId: created[0]!.id },
  });
  await prisma.like.create({
    data: { userId: ada.id, postId: created[1]!.id },
  });
  await prisma.like.create({
    data: { userId: grace.id, postId: created[4]!.id },
  });

  // Mutual follows so follower/following counts are visible.
  await prisma.follow.create({
    data: { followerId: ada.id, followingId: grace.id },
  });
  await prisma.follow.create({
    data: { followerId: grace.id, followingId: ada.id },
  });

  console.log(
    `Seeded ${created.length} posts for ${ada.email} and ${grace.email} (password: password123)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
