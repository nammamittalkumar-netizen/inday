import { NextResponse } from "next/server";

// Lightweight liveness/readiness probe for Kubernetes. Deliberately avoids the
// database so a transient DB blip doesn't get pods killed by the kubelet.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", uptime: process.uptime() });
}
