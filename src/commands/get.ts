import { getSecret } from "../application/vault.js";
import { loadIdentityFromPrivateKey, requirePrivateKeyFromEnv } from "../application/identity.js";

export async function runGetCommand(secretName: string): Promise<void> {
  const privateKey = requirePrivateKeyFromEnv("❌ Error: AGENT_PRIV_KEY environment variable is required to access the vault.");

  try {
    const identity = await loadIdentityFromPrivateKey(privateKey);
    const secret = getSecret(identity, secretName);
    if (secret) {
      console.log(`[${secretName}]:`, secret);
    } else {
      console.log(`❌ Error: Secret name "${secretName}" not found in vault.`);
    }
  } catch (e: any) {
    console.error("❌ Error accessing vault:", e.message);
  }
}
