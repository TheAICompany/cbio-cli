import { startLocalAuthProxy } from "@the-ai-company/cbio-node-runtime";
import type { CbioIdentity } from "@the-ai-company/cbio-node-runtime";

export function validateUpstreamUrl(rawUrl: string): string {
  const upstreamBaseUrl = rawUrl.trim();

  try {
    const parsed = new URL(upstreamBaseUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return upstreamBaseUrl;
    }
  } catch {
    // Fall through to the shared error path below.
  }

  throw new Error(`❌ Invalid upstream URL: "${rawUrl}". Must be a valid http:// or https:// URL.`);
}

export function resolveProxyPort(): number {
  const port = process.env.C_BIO_PROXY_PORT ? Number(process.env.C_BIO_PROXY_PORT) : 0;
  if (Number.isNaN(port)) {
    throw new Error("❌ Error: C_BIO_PROXY_PORT must be a valid number.");
  }
  return port;
}

export async function startProxy(identity: CbioIdentity, upstreamBaseUrl: string, secretName: string, port: number) {
  return startLocalAuthProxy({
    authHandle: identity,
    secretName,
    upstreamBaseUrl,
    port,
  });
}
