import { promises as dns } from "node:dns";

/**
 * Verifies that an email address points at a domain that can actually
 * receive mail. This is a deliverability heuristic, not proof the exact
 * mailbox exists (that can't be known without sending a message): we look up
 * the domain's MX records, falling back to A/AAAA records (RFC 5321 §5.1
 * implicit MX). A domain with neither cannot receive email.
 */
export async function emailDomainExists(email: string): Promise<boolean> {
  const domain = email.split("@")[1]?.trim().toLowerCase();
  if (!domain || domain.includes(" ")) return false;

  try {
    const mx = await dns.resolveMx(domain);
    // Some misconfigured domains return a single null-MX (".") record.
    if (mx.some((r) => r.exchange && r.exchange !== ".")) return true;
  } catch {
    // No MX records — fall through to an address-record check.
  }

  try {
    await dns.resolve4(domain);
    return true;
  } catch {
    // ignore
  }

  try {
    await dns.resolve6(domain);
    return true;
  } catch {
    // ignore
  }

  return false;
}
