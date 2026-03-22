import { createIdentityMaterial, verifyVaultPersistence } from "../application/identity.js";

export async function runInitCommand(): Promise<void> {
  const { publicKey, privateKey, ownerId, agentId, vaultId } = createIdentityMaterial();

  console.log("=== Claw-biometric Identity Initialized ===");
  console.log(`AGENT_PUB_KEY=${publicKey}`);
  console.log(`AGENT_PRIV_KEY=${privateKey}`);
  console.log(`OWNER_ID=${ownerId}`);
  console.log(`AGENT_ID=${agentId}`);
  console.log(`VAULT_ID=${vaultId}`);
  console.log("---------------------------------");
  console.log("OWNER_ID is the owner identity derived from this keypair.");
  console.log("AGENT_ID is the default agent identity derived from the same keypair.");
  console.log("Copy and store AGENT_PRIV_KEY securely. It never leaves your machine.");
  console.log("Save the private key now, then close this terminal session as soon as you are done.");

  try {
    const vaultPath = await verifyVaultPersistence(publicKey, privateKey);
    console.log("✅ Vault path is writable:", vaultPath);
  } catch (e: any) {
    console.log("\n⚠️  WARNING: Vault persistence setup failed.");
    console.log(e.message);
  }
}
