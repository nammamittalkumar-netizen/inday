"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Lock, Mail, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconField, PasswordField } from "@/components/ui/field";
import { apiFetch, ApiError } from "@/lib/api-client";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";

export function SignupForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: SignupInput) {
    setSubmitting(true);
    try {
      await apiFetch("/api/signup", {
        method: "POST",
        body: JSON.stringify(values),
      });

      // Auto-login after successful signup.
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (res?.error) {
        toast.success("Account created — please log in");
        router.push("/login");
        return;
      }
      toast.success("Welcome to Inday!");
      // Send new users to pick interests so we can suggest people to follow.
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't create account",
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <IconField
        id="name"
        label="Name"
        icon={User}
        autoComplete="name"
        placeholder="Jane Doe"
        error={errors.name?.message}
        {...register("name")}
      />

      <IconField
        id="email"
        label="Email"
        icon={Mail}
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <PasswordField
        id="password"
        label="Password"
        icon={Lock}
        autoComplete="new-password"
        placeholder="••••••••"
        error={errors.password?.message}
        hint="At least 8 characters."
        {...register("password")}
      />

      <Button
        type="submit"
        size="lg"
        className="mt-2 w-full"
        disabled={submitting}
      >
        {submitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
