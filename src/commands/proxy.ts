import { loadOwnerContextFromEnvOrPrompt } from "../application/identity.js";
import { resolveProxyPort, startProxy, validateUpstreamUrl } from "../application/proxy.js";
import { exportSecretPlaintext } from "../application/vault.js";

export async function runProxyCommand(rawUrl: string, secretName = "default"): Promise<void> {
  let upstreamBaseUrl: string;
  let port: number;

  try {
    upstreamBaseUrl = validateUpstreamUrl(rawUrl);
    port = resolveProxyPort();
  } catch (e: any) {
    console.error(e.message);
    process.exit(1);
  }

  const context = await loadOwnerContextFromEnvOrPrompt("AGENT_PRIV_KEY not set. Enter private key: ");
  const secretValue = await exportSecretPlaintext(context, secretName);
  if (!secretValue) {
    console.error(`❌ Error: Secret name "${secretName}" not found in vault.`);
    process.exit(1);
  }

  const handle = await startProxy(secretValue, upstreamBaseUrl, secretName, port);

  console.log("c-bio local auth proxy started");
  console.log(`Upstream:   ${handle.upstreamBaseUrl}`);
  console.log(`Secret:     ${handle.secretName}`);
  console.log(`Base URL:   ${handle.baseUrl}`);
  console.log("");
  console.log("Point your client at the local Base URL and omit the raw API key from agent logic.");
  console.log("Press Ctrl+C to stop.");

  const shutdown = async () => {
    await handle.close().catch(() => {});
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
