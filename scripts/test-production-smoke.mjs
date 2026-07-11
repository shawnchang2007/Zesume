const baseUrl = process.env.PRODUCTION_BASE_URL;

if (!baseUrl || !baseUrl.startsWith("https://")) {
  throw new Error("PRODUCTION_BASE_URL must be an https URL.");
}

const providers = await fetch(`${baseUrl}/api/auth/providers`);
const providerData = await providers.json();

if (!providers.ok || !providerData.google) {
  throw new Error("Google Auth provider smoke test failed.");
}

const session = await fetch(`${baseUrl}/api/auth/session`);
if (!session.ok) throw new Error("Auth session smoke test failed.");

const templateAnalysis = await fetch(
  `${baseUrl}/api/resume/template/analyze`,
  { method: "POST", body: new FormData() },
);
if (templateAnalysis.status !== 401) {
  throw new Error("Template authorization smoke test failed.");
}

const oversizedRewrite = await fetch(`${baseUrl}/api/resume/rewrite`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ resumeText: "a".repeat(70_000) }),
});
if (oversizedRewrite.status !== 413) {
  throw new Error("Rewrite request limit smoke test failed.");
}

console.log("Production Auth, permission, and request-limit smoke tests passed.");
