/**
 * Sends one real test email through Resend using the configured settings.
 *
 *   npm run email:test                  # sends to LEADS_NOTIFY_EMAIL
 *   npm run email:test -- you@example.com
 *
 * Reads RESEND_API_KEY, EMAIL_FROM and LEADS_NOTIFY_EMAIL from the environment
 * or .env.production.local / .env.local. Never prints the API key.
 */
const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM;
const to = process.argv[2] || process.env.LEADS_NOTIFY_EMAIL;

const missing = [!apiKey && "RESEND_API_KEY", !from && "EMAIL_FROM", !to && "LEADS_NOTIFY_EMAIL (or pass an address)"].filter(Boolean);
if (missing.length) {
  console.error(`Missing: ${missing.join(", ")}`);
  process.exit(1);
}

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from,
    to: [to],
    subject: "WebAIAutomation test email",
    text: `This is a test email from the WebAIAutomation server, sent at ${new Date().toISOString()}.\nIf you received it, Resend is configured correctly.`,
  }),
  signal: AbortSignal.timeout(15_000),
}).catch((error) => {
  console.error(`Request failed: ${error.message}`);
  process.exit(1);
});

const body = await response.text();
if (!response.ok) {
  console.error(`Resend returned ${response.status}: ${body.slice(0, 300)}`);
  process.exit(1);
}
console.log(`Accepted by Resend (${response.status}): ${body.slice(0, 200)}`);
console.log(`Now check the inbox of ${to} (and its spam folder).`);
