import { createHmac } from "node:crypto";

/**
 * Short-lived ticket used to authenticate a WebSocket upgrade.
 *
 * The browser can't set Authorization headers on a WebSocket handshake, so the
 * client first calls an authenticated REST route to mint a signed ticket, then
 * passes it as a query param when opening the socket. The custom server
 * (server.mjs) verifies the signature with the same AUTH_SECRET — no shared
 * state needed, which matters because the route handler and the custom server
 * run in separate module graphs.
 */
const TTL_MS = 60_000;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

/** Mint a signed ticket of the form `base64url(userId.exp).hmac`. */
export function signWsTicket(userId: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = `${userId}.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}
