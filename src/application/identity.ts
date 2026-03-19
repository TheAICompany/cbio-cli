import { CbioIdentity, generateIdentityKeys } from "@the-ai-company/cbio-node-runtime";
import { getVaultPath, deriveRootAgentId } from "@the-ai-company/cbio-node-runtime/protocol";
import { derivePublicKey } from "@the-ai-company/cbio-node-runtime";
import { readSecretNoEcho } from "../lib/terminal/readSecret.js";

function normalizePrivateKey(value?: string): string {
  return value?.replace(/\s/g, "").trim() ?? "";
}

export async function requirePrivateKeyFromEnvOrPrompt(prompt: string): Promise<string> {
  const envKey = normalizePrivateKey(process.env.AGENT_PRIV_KEY);
  if (envKey) {
    return envKey;
  }

  const promptedKey = normalizePrivateKey(await readSecretNoEcho(prompt));
  if (promptedKey) {
    return promptedKey;
  }

  console.error("No key provided.");
  process.exit(1);
}

export function requirePrivateKeyFromEnv(errorMessage: string): string {
  const privateKey = process.env.AGENT_PRIV_KEY;
  if (privateKey) {
    return privateKey;
  }

  console.error(errorMessage);
  process.exit(1);
}

export async function loadIdentityFromPrivateKey(privateKey: string): Promise<CbioIdentity> {
  return CbioIdentity.load({ privateKey });
}

export async function loadIdentityFromEnvOrPrompt(prompt: string): Promise<CbioIdentity> {
  const privateKey = await requirePrivateKeyFromEnvOrPrompt(prompt);
  return loadIdentityFromPrivateKey(privateKey);
}

export function deriveAgentIdFromPrivateKey(privateKey: string): string {
  const publicKey = derivePublicKey(privateKey);
  return deriveRootAgentId(publicKey);
}

export function createIdentityMaterial() {
  const { publicKey, privateKey } = generateIdentityKeys();
  const resolvedPublicKey = publicKey || derivePublicKey(privateKey);
  const agentId = deriveRootAgentId(resolvedPublicKey);

  return {
    privateKey,
    publicKey: resolvedPublicKey,
    agentId,
  };
}

export async function verifyVaultPersistence(publicKey: string, privateKey: string): Promise<string> {
  await CbioIdentity.load({ publicKey, privateKey });
  return getVaultPath(publicKey);
}
