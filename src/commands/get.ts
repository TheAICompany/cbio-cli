import { loadOwnerContextFromPrivateKey, requirePrivateKeyFromEnv } from "../application/identity.js";
import { exportSecretPlaintext } from "../application/vault.js";

export async function runGetCommand(secretName: string): Promise<void> {
  const privateKey = requirePrivateKeyFromEnv("❌ Error: AGENT_PRIV_KEY environment variable is required to access the vault.");
  const context = await loadOwnerContextFromPrivateKey(privateKey);
  const secret = await exportSecretPlaintext(context, secretName);

  if (secret === undefined) {
    console.log(`❌ Error: Secret name "${secretName}" not found in vault.`);
    return;
  }

  console.log(`[${secretName}]:`, secret);
}
