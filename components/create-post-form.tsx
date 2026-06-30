"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import { apiFetch, ApiError } from "@/lib/api-client";
import { createPostSchema, type CreatePostInput } from "@/lib/validations/post";

const MAX = 500;

export function CreatePostForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [length, setLength] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { body: "" },
  });

  const bodyField = register("body");

  async function onSubmit(values: CreatePostInput) {
    setSubmitting(true);
    try {
      await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ ...values, imageUrl }),
      });
      toast.success("Posted!");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't publish post");
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="body" className="sr-only">
              Your incident
            </label>
            <Textarea
              id="body"
              rows={5}
              maxLength={MAX}
              placeholder="What happened today? Tell us about the incident…"
              aria-invalid={!!errors.body}
              className="resize-none text-[15px]"
              {...bodyField}
              onChange={(e) => {
                bodyField.onChange(e);
                setLength(e.target.value.length);
              }}
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-destructive">{errors.body?.message}</span>
              <span
                className={
                  length > MAX ? "text-destructive" : "text-muted-foreground"
                }
              >
                {length}/{MAX}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Photo (optional)
            </p>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              kind="posts"
              disabled={submitting}
              label="Attach a photo"
              camera
            />
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <Button type="submit" disabled={submitting || length === 0}>
              {submitting ? "Publishing…" : "Publish incident"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
