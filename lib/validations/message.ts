import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Message can't be empty")
    .max(2000, "Messages are limited to 2000 characters"),
});

export const startConversationSchema = z.object({
  userId: z.string().min(1, "A recipient is required"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
