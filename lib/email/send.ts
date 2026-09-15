import "server-only";

import type { RenderedEmail } from "@/lib/email/templates";

/**
 * Resend's REST API, called with plain fetch — no SDK dependency for what is
 * one HTTP POST. Swap the provider here and nothing else in the app changes.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type SendResult = { ok: true } | { ok: false; reason: string };

export async function sendEmail(to: string, email: RenderedEmail): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { ok: false, reason: "email_not_configured" };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });

    if (!res.ok) {
      // Log the provider's reason server-side for debugging, but never return
      // it to the caller — the webhook's response is reachable by anyone who
      // can guess the endpoint.
      console.error("sendEmail: provider rejected the message", res.status, await res.text().catch(() => ""));
      return { ok: false, reason: "provider_error" };
    }

    return { ok: true };
  } catch (error) {
    console.error("sendEmail: request failed", error);
    return { ok: false, reason: "request_failed" };
  }
}
