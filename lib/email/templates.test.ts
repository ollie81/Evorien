import { describe, expect, it } from "vitest";
import { renderNotificationEmail } from "./templates";

const base = {
  type: "MESSAGE_RECEIVED",
  title: "New message",
  body: "Theodore sent you a message.",
  link: "/messages/abc",
  siteUrl: "https://ollieen.com",
};

describe("renderNotificationEmail", () => {
  it("builds an absolute link from the canonical site url", () => {
    const email = renderNotificationEmail(base);
    expect(email.html).toContain("https://ollieen.com/messages/abc");
    expect(email.text).toContain("https://ollieen.com/messages/abc");
  });

  it("uses the notification title as the subject", () => {
    expect(renderNotificationEmail(base).subject).toBe("New message");
  });

  it("gives each notification type its own call to action", () => {
    expect(renderNotificationEmail(base).html).toContain("Read message");
    expect(renderNotificationEmail({ ...base, type: "CONNECTION_REQUEST" }).html).toContain("View request");
  });

  it("falls back to the site root rather than following an absolute link", () => {
    const email = renderNotificationEmail({ ...base, link: "https://evil.example.com/phish" });
    expect(email.html).not.toContain("evil.example.com");
    expect(email.html).toContain('href="https://ollieen.com/"');
  });

  it("refuses a protocol-relative link, which would leave the site", () => {
    const email = renderNotificationEmail({ ...base, link: "//evil.example.com" });
    expect(email.html).not.toContain("evil.example.com");
  });

  it("escapes html so a crafted name cannot inject markup", () => {
    const email = renderNotificationEmail({
      ...base,
      body: '<script>alert("x")</script>',
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("tolerates a trailing slash on the site url without doubling it", () => {
    const email = renderNotificationEmail({ ...base, siteUrl: "https://ollieen.com/" });
    expect(email.html).toContain("https://ollieen.com/messages/abc");
    expect(email.html).not.toContain("ollieen.com//messages");
  });

  it("omits the body paragraph when there is no body", () => {
    const email = renderNotificationEmail({ ...base, body: null });
    expect(email.html).toContain("New message");
    expect(email.subject).toBe("New message");
  });

  it("always includes a way to turn the emails off", () => {
    const email = renderNotificationEmail(base);
    expect(email.html).toContain("https://ollieen.com/settings");
    expect(email.text).toContain("https://ollieen.com/settings");
  });
});
