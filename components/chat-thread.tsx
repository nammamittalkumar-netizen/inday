"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MESSAGES_READ_EVENT } from "@/components/messages-indicator";
import { apiFetch, ApiError } from "@/lib/api-client";
import { clockTime, dayBucket } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Author, ChatMessage, MessagePage } from "@/lib/types";

// Safety poll cadence used only while the socket is disconnected.
const FALLBACK_POLL_MS = 8000;
const MAX = 2000;

type Props = { conversationId: string; meId: string; otherUser: Author };

export function ChatThread({ conversationId, meId, otherUser }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(false);
  const [body, setBody] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);
  const wsOpen = useRef(false);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const mergeNew = useCallback((incoming: ChatMessage[]) => {
    setMessages((prev) => {
      const have = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !have.has(m.id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }, []);

  const poll = useCallback(async () => {
    try {
      const page = await apiFetch<MessagePage>(
        `/api/conversations/${conversationId}/messages`,
      );
      mergeNew([...page.messages].reverse());
      window.dispatchEvent(new Event(MESSAGES_READ_EVENT));
    } catch {
      // next tick retries
    }
  }, [conversationId, mergeNew]);

  // Initial history load (REST). Marks read.
  useEffect(() => {
    let active = true;
    apiFetch<MessagePage>(`/api/conversations/${conversationId}/messages`)
      .then((page) => {
        if (!active) return;
        setMessages([...page.messages].reverse());
        setOlderCursor(page.nextCursor);
        window.dispatchEvent(new Event(MESSAGES_READ_EVENT));
      })
      .catch((err) => {
        if (active) {
          toast.error(
            err instanceof ApiError ? err.message : "Couldn't load messages",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [conversationId]);

  // WebSocket connection with auto-reconnect.
  useEffect(() => {
    let active = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    async function connect() {
      if (!active) return;
      try {
        const { ticket } = await apiFetch<{ ticket: string }>(
          "/api/realtime/ticket",
        );
        if (!active) return;
        const proto = location.protocol === "https:" ? "wss" : "ws";
        const ws = new WebSocket(
          `${proto}://${location.host}/api/ws?ticket=${encodeURIComponent(ticket)}`,
        );
        wsRef.current = ws;

        ws.onopen = () => {
          wsOpen.current = true;
          setLive(true);
          ws.send(JSON.stringify({ t: "sub", c: conversationId }));
        };
        ws.onmessage = (e) => {
          let msg: { t: string; c?: string; message?: ChatMessage; error?: string };
          try {
            msg = JSON.parse(e.data);
          } catch {
            return;
          }
          if (msg.t === "msg" && msg.c === conversationId && msg.message) {
            const m = msg.message;
            mergeNew([{ ...m, fromMe: m.senderId === meId }]);
            window.dispatchEvent(new Event(MESSAGES_READ_EVENT));
          } else if (msg.t === "err" && msg.error) {
            toast.error(msg.error);
          }
        };
        ws.onclose = () => {
          wsOpen.current = false;
          setLive(false);
          wsRef.current = null;
          if (active) reconnectTimer = setTimeout(connect, 2500);
        };
        ws.onerror = () => ws.close();
      } catch {
        if (active) reconnectTimer = setTimeout(connect, 3000);
      }
    }

    connect();
    return () => {
      active = false;
      clearTimeout(reconnectTimer);
      wsOpen.current = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [conversationId, meId, mergeNew]);

  // Safety poll — runs only while the socket is down.
  useEffect(() => {
    const id = setInterval(() => {
      if (!wsOpen.current) poll();
    }, FALLBACK_POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  useEffect(() => {
    if (stickToBottom.current) scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function loadOlder() {
    if (!olderCursor || loadingOlder) return;
    setLoadingOlder(true);
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    try {
      const page = await apiFetch<MessagePage>(
        `/api/conversations/${conversationId}/messages?cursor=${olderCursor}`,
      );
      const older = [...page.messages].reverse();
      setMessages((prev) => [...older, ...prev]);
      setOlderCursor(page.nextCursor);
      requestAnimationFrame(() => {
        const node = scrollRef.current;
        if (node) node.scrollTop = node.scrollHeight - prevHeight;
      });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't load older messages",
      );
    } finally {
      setLoadingOlder(false);
    }
  }

  async function send() {
    const value = body.trim();
    if (!value || sending) return;
    stickToBottom.current = true;

    const ws = wsRef.current;
    if (ws && wsOpen.current && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ t: "msg", c: conversationId, body: value }));
      setBody("");
      return;
    }

    setSending(true);
    try {
      const res = await apiFetch<{ message: ChatMessage }>(
        `/api/conversations/${conversationId}/messages`,
        { method: "POST", body: JSON.stringify({ body: value }) },
      );
      mergeNew([res.message]);
      setBody("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't send");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-80 flex-col overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-muted/30 to-background">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:px-4"
      >
        {loading ? (
          <ThreadSkeleton />
        ) : messages.length === 0 ? (
          <EmptyThread name={otherUser.name} />
        ) : (
          <>
            {olderCursor && (
              <div className="pb-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={loadOlder}
                  disabled={loadingOlder}
                >
                  {loadingOlder ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Load earlier messages"
                  )}
                </Button>
              </div>
            )}

            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const day = dayBucket(m.createdAt);
              const showDay = !prev || dayBucket(prev.createdAt) !== day;
              const groupStart =
                showDay || !prev || prev.fromMe !== m.fromMe;
              const groupEnd =
                !next ||
                next.fromMe !== m.fromMe ||
                dayBucket(next.createdAt) !== day;

              return (
                <div key={m.id}>
                  {showDay && (
                    <div className="my-3 flex justify-center">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        {day}
                      </span>
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex items-end gap-2",
                      m.fromMe ? "justify-end" : "justify-start",
                      groupStart ? "mt-2" : "mt-0.5",
                    )}
                  >
                    {/* Avatar gutter for incoming messages */}
                    {!m.fromMe && (
                      <div className="w-7 shrink-0 self-end">
                        {groupEnd && (
                          <UserAvatar
                            name={otherUser.name}
                            image={otherUser.image}
                            className="size-7"
                            fallbackClassName="text-[11px]"
                          />
                        )}
                      </div>
                    )}

                    <div
                      className={cn(
                        "flex max-w-[78%] flex-col",
                        m.fromMe ? "items-end" : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "whitespace-pre-wrap break-words px-3.5 py-2 text-sm shadow-sm",
                          m.fromMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-foreground ring-1 ring-border",
                          // Rounded bubble with a subtle tail at the group's end.
                          "rounded-2xl",
                          m.fromMe && groupEnd && "rounded-br-md",
                          !m.fromMe && groupEnd && "rounded-bl-md",
                        )}
                      >
                        {m.body}
                      </div>
                      {groupEnd && (
                        <time
                          dateTime={m.createdAt}
                          className="mt-1 px-1 text-[11px] text-muted-foreground"
                        >
                          {clockTime(m.createdAt)}
                        </time>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background/80 p-2 backdrop-blur sm:p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2 rounded-3xl border border-border bg-card py-1.5 pl-3 pr-1.5 shadow-sm focus-within:ring-2 focus-within:ring-ring"
        >
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX}
            placeholder={live ? "Message…" : "Connecting…"}
            aria-label="Message"
            className="max-h-32 min-h-8 flex-1 resize-none border-0 bg-transparent px-0 py-1.5 shadow-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            size="icon"
            className="size-9 shrink-0 rounded-full"
            disabled={sending || body.trim().length === 0}
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SendHorizontal className="size-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function EmptyThread({ name }: { name: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-10 text-center">
      <p className="text-sm font-medium">This is the start of your chat</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Say hello to {name} 👋
      </p>
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div className="space-y-3">
      {[
        "items-start",
        "items-end",
        "items-start",
        "items-end",
        "items-start",
      ].map((align, i) => (
        <div key={i} className={cn("flex animate-pulse flex-col", align)}>
          <div
            className={cn(
              "h-9 rounded-2xl bg-muted",
              i % 2 ? "w-40" : "w-52",
            )}
          />
        </div>
      ))}
    </div>
  );
}
