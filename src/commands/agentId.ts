import { deriveAgentIdFromPrivateKey, requirePrivateKeyFromEnvOrPrompt } from "../application/identity.js";

export async function runAgentIdCommand(): Promise<void> {
  const privateKey = await requirePrivateKeyFromEnvOrPrompt("AGENT_PRIV_KEY not set. Enter private key: ");
  console.log(deriveAgentIdFromPrivateKey(privateKey));
}
