import { z } from "zod";

/** Accept only Cloudinary HTTPS URLs (what our /api/upload returns). */
const imageUrl = z
  .url("Invalid image URL")
  .refine((u) => /^https:\/\/res\.cloudinary\.com\//.test(u), {
    message: "Image must be uploaded through Inday",
  });

export const createPostSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Say something about your incident")
    .max(500, "Posts are limited to 500 characters"),
  imageUrl: imageUrl.nullish(),
});

export const updatePostSchema = createPostSchema;

export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Comment can't be empty")
    .max(300, "Comments are limited to 300 characters"),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be at most 60 characters"),
  bio: z
    .string()
    .trim()
    .max(200, "Bio must be at most 200 characters")
    .optional()
    .or(z.literal("")),
  image: imageUrl.nullish(),
});

export const updateInterestsSchema = z.object({
  // Catalog slugs; unknown slugs are filtered server-side via sanitizeInterestSlugs.
  interests: z.array(z.string().trim().max(40)).max(20),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateInterestsInput = z.infer<typeof updateInterestsSchema>;
