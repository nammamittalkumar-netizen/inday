import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations/auth";
import { handleApiError, jsonError } from "@/lib/http";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { emailDomainExists } from "@/lib/email";

const SALT_ROUNDS = 12;

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000); // 5 / hour
    if (!limit.success) {
      return jsonError("Too many signups. Please try again later.", 429);
    }

    const body = await req.json().catch(() => null);
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 422 },
      );
    }

    const { name, email, password } = parsed.data;

    // Reject emails whose domain can't receive mail (deliverability check).
    if (!(await emailDomainExists(email))) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: [
            {
              path: "email",
              message: "That email domain doesn't appear to exist",
            },
          ],
        },
        { status: 422 },
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const user = await prisma.user.create({
        data: { name, email, passwordHash },
        select: { id: true, name: true, email: true, createdAt: true },
      });
      return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return jsonError("An account with that email already exists", 409);
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
