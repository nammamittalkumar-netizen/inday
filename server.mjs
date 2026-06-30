// Custom Next.js server that adds a WebSocket endpoint at /api/ws for live chat.
// Run via `node server.mjs` (see package.json scripts). This file is NOT bundled
// by Next, so it uses only Node + node_modules and plain JS.
import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import nextEnv from "@next/env"; // CommonJS — default import then destructure
import next from "next";
import { WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";

const dev = process.env.NODE_ENV !== "production";

// Populate process.env from .env* before anything reads it (Prisma, AUTH_SECRET).
nextEnv.loadEnvConfig(process.cwd(), dev);

const port = parseInt(process.env.PORT || "3000", 10);
const prisma = new PrismaClient();

const app = next({ dev });
const handle = app.getRequestHandler();

// ── ticket verification (mirrors lib/realtime.ts signWsTicket) ──────────────
function verifyTicket(token) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const payload = Buffer.from(payloadB64, "base64url").toString();
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const sep = payload.indexOf(".");
  const userId = payload.slice(0, sep);
  const exp = Number(payload.slice(sep + 1));
  if (!userId || !Number.isFinite(exp) || exp < Date.now()) return null;
  return userId;
}

// ── conversation rooms: conversationId -> Set<ws> ───────────────────────────
const rooms = new Map();

function joinRoom(convoId, ws) {
  let set = rooms.get(convoId);
  if (!set) rooms.set(convoId, (set = new Set()));
  set.add(ws);
  ws.subs.add(convoId);
}

function leaveAll(ws) {
  for (const convoId of ws.subs) {
    const set = rooms.get(convoId);
    if (set) {
      set.delete(ws);
      if (set.size === 0) rooms.delete(convoId);
    }
  }
  ws.subs.clear();
}

function broadcast(convoId, payload) {
  const set = rooms.get(convoId);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const client of set) {
    if (client.readyState === 1 /* OPEN */) client.send(data);
  }
}

function isMember(convoId, userId) {
  return prisma.conversationParticipant
    .findUnique({
      where: { conversationId_userId: { conversationId: convoId, userId } },
      select: { id: true },
    })
    .then(Boolean);
}

async function persistAndBroadcast(convoId, senderId, rawBody) {
  const body = String(rawBody ?? "").trim();
  if (!body) return { error: "Message can't be empty" };
  if (body.length > 2000) return { error: "Messages are limited to 2000 characters" };
  if (!(await isMember(convoId, senderId))) return { error: "Conversation not found" };

  const now = new Date();
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: convoId, senderId, body },
      select: { id: true, body: true, createdAt: true, senderId: true },
    }),
    prisma.conversation.update({ where: { id: convoId }, data: { lastMessageAt: now } }),
    prisma.conversationParticipant.updateMany({
      where: { conversationId: convoId, userId: senderId },
      data: { lastReadAt: now },
    }),
  ]);

  broadcast(convoId, {
    t: "msg",
    c: convoId,
    message: {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      senderId: message.senderId,
    },
  });
  return { ok: true };
}

app.prepare().then(() => {
  const upgradeHandler = app.getUpgradeHandler();
  const server = createServer((req, res) => handle(req, res));
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.subs = new Set();
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      try {
        if (msg.t === "sub" && typeof msg.c === "string") {
          if (!(await isMember(msg.c, ws.userId))) {
            ws.send(JSON.stringify({ t: "err", error: "Not a participant" }));
            return;
          }
          joinRoom(msg.c, ws);
          await prisma.conversationParticipant.updateMany({
            where: { conversationId: msg.c, userId: ws.userId },
            data: { lastReadAt: new Date() },
          });
          ws.send(JSON.stringify({ t: "ready", c: msg.c }));
        } else if (msg.t === "msg" && typeof msg.c === "string") {
          const res = await persistAndBroadcast(msg.c, ws.userId, msg.body);
          if (res.error) ws.send(JSON.stringify({ t: "err", error: res.error }));
        }
      } catch {
        ws.send(JSON.stringify({ t: "err", error: "Something went wrong" }));
      }
    });

    ws.on("close", () => leaveAll(ws));
    ws.on("error", () => leaveAll(ws));
  });

  // Drop dead connections so rooms don't leak.
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30_000);
  wss.on("close", () => clearInterval(heartbeat));

  server.on("upgrade", (req, socket, head) => {
    let pathname;
    try {
      pathname = new URL(req.url, "http://localhost").pathname;
    } catch {
      socket.destroy();
      return;
    }

    if (pathname === "/api/ws") {
      const ticket = new URL(req.url, "http://localhost").searchParams.get("ticket");
      const userId = verifyTicket(ticket);
      if (!userId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        ws.userId = userId;
        wss.emit("connection", ws, req);
      });
    } else {
      // Everything else (e.g. Next's HMR socket in dev) goes to Next.
      upgradeHandler(req, socket, head);
    }
  });

  server.listen(port, () => {
    console.log(`> Inday ready on http://localhost:${port} (ws: /api/ws)`);
  });
});
