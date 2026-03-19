import { createIdentityMaterial, verifyVaultPersistence } from "../application/identity.js";

export async function runInitCommand(): Promise<void> {
  const { publicKey, privateKey, agentId } = createIdentityMaterial();

  console.log("=== Claw-biometric Identity Initialized ===");
  console.log("Public Key: ", publicKey);
  console.log("Private Key:", privateKey);
  console.log("Agent ID:   ", agentId);
  console.log("---------------------------------");
  console.log("Keep your Private Key safe! It never leaves your machine.");

  try {
    const vaultPath = await verifyVaultPersistence(publicKey, privateKey);
    console.log("✅ Vault path is writable:", vaultPath);
  } catch (e: any) {
    console.log("\n⚠️  WARNING: Vault persistence setup failed.");
    console.log(e.message);
  }
}
