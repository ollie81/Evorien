import { timingSafeEqual } from "node:crypto";
import { sendEmail } from "@/lib/email/send";
import { renderNotificationEmail } from "@/lib/email/templates";

/**
 * Called only by the database's on_notification_send_email trigger (via
 * pg_net), never by a browser. The database is the privileged party here: it
 * can read auth.users.email, so it sends the recipient address in the payload
 * and this route just forwards to the email provider. That is what keeps the
 * app itself from ever being able to read another member's email address, and
 * why no service-role key is needed anywhere.
 *
 * The shared secret is the only thing standing between this endpoint and
 * anyone who guesses the URL, so every failure path returns the same opaque
 * response and nothing here echoes the request back.
 */
function secretMatches(provided: string | null): boolean {
  const expected = process.env.EMAIL_WEBHOOK_SECRET;
  if (!expected || !provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

interface WebhookPayload {
  to?: unknown;
  type?: unknown;
  title?: unknown;
  body?: unknown;
  link?: unknown;
}

export async function POST(request: Request) {
  if (!secretMatches(request.headers.get("X-Ollieen-Signature"))) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as WebhookPayload | null;
  if (!payload || typeof payload.to !== "string" || typeof payload.title !== "string") {
    return Response.json({ ok: false }, { status: 400 });
  }

  const siteUrl = process.env.SITE_URL ?? "https://ollieen.com";

  const email = renderNotificationEmail({
    type: typeof payload.type === "string" ? payload.type : "",
    title: payload.title,
    body: typeof payload.body === "string" ? payload.body : null,
    link: typeof payload.link === "string" ? payload.link : null,
    siteUrl,
  });

  const result = await sendEmail(payload.to, email);

  // A provider failure is logged in sendEmail and reported as a 502 so the
  // failure is visible in logs, but the in-app notification already exists
  // either way — email is strictly an enhancement, never the source of truth.
  return Response.json({ ok: result.ok }, { status: result.ok ? 200 : 502 });
}
