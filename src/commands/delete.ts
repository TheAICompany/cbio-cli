import * as readline from "node:readline/promises";
import { deleteSecret } from "../application/vault.js";
import { loadIdentityFromPrivateKey, requirePrivateKeyFromEnv } from "../application/identity.js";

export async function runDeleteCommand(secretName: string): Promise<void> {
  const privateKey = requirePrivateKeyFromEnv("❌ Error: AGENT_PRIV_KEY environment variable is required to modify the vault.");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await rl.question(`⚠️  DANGER: Are you sure you want to permanently DELETE "${secretName}"? (y/N): `);
  rl.close();

  if (answer.toLowerCase() !== "y") {
    console.log("Operation cancelled.");
    return;
  }

  try {
    const identity = await loadIdentityFromPrivateKey(privateKey);
    await deleteSecret(identity, secretName);
    console.log(`✅ Success: Secret "${secretName}" has been physically destroyed.`);
  } catch (e: any) {
    console.error("❌ Error deleting secret:", e.message);
  }
}
