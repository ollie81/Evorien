export interface NotificationEmailInput {
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  /** Canonical origin, e.g. https://ollieen.com. Passed in rather than derived from the request: an email must always point at the real site, never at whatever host happened to call the webhook. */
  siteUrl: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** The one action word that makes sense per notification type. */
function callToAction(type: string): string {
  switch (type) {
    case "CONNECTION_REQUEST":
      return "View request";
    case "CONNECTION_ACCEPTED":
      return "View connection";
    case "MESSAGE_RECEIVED":
      return "Read message";
    case "VERIFICATION_APPROVED":
    case "VERIFICATION_REJECTED":
      return "View your Passport";
    default:
      return "Open Ollieen";
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Deliberately plain, table-free, inline-styled HTML — the formats that
 * actually survive Gmail, Outlook and Apple Mail without a rendering library.
 * Ollieen's dark identity is not reproduced here on purpose: dark-background
 * email renders unpredictably across clients, and a legible light email that
 * arrives intact beats a branded one that breaks.
 */
export function renderNotificationEmail(input: NotificationEmailInput): RenderedEmail {
  const siteUrl = input.siteUrl.replace(/\/$/, "");
  // Only ever build a link from our own origin plus the notification's own
  // relative path — never from anything that could redirect off-site.
  const path = input.link && input.link.startsWith("/") && !input.link.startsWith("//") ? input.link : "/";
  const url = `${siteUrl}${path}`;
  const action = callToAction(input.type);
  const settingsUrl = `${siteUrl}/settings`;

  const subject = input.title;
  const bodyLine = input.body ?? "";

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <p style="margin:0 0 24px;font-size:14px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6d5ef5;">Ollieen</p>
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;font-weight:600;">${escapeHtml(input.title)}</h1>
      ${bodyLine ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#52525b;">${escapeHtml(bodyLine)}</p>` : ""}
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#6d5ef5;color:#ffffff;text-decoration:none;font-size:15px;font-weight:500;padding:12px 20px;border-radius:8px;">${escapeHtml(action)}</a>
      <p style="margin:32px 0 0;font-size:13px;line-height:1.5;color:#a1a1aa;">
        You're receiving this because you have email notifications turned on.
        <a href="${escapeHtml(settingsUrl)}" style="color:#71717a;">Turn them off</a>.
      </p>
    </div>
  </body>
</html>`;

  const text = [input.title, bodyLine, "", `${action}: ${url}`, "", `Turn off these emails: ${settingsUrl}`]
    .filter((line) => line !== null)
    .join("\n");

  return { subject, html, text };
}
