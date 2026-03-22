import os from "node:os";
import path from "node:path";
import process from "node:process";
import { createHash } from "node:crypto";
import {
  createIdentity,
  restoreIdentity,
  createVault,
  recoverVault,
  LocalSigner,
  FsStorageProvider,
  createVaultClient,
  derivePublicKey,
  SystemClock,
} from "@the-ai-company/cbio-node-runtime";
import type { VaultClient, VaultService } from "@the-ai-company/cbio-node-runtime";
import { readSecretNoEcho } from "../lib/terminal/readSecret.js";

function normalizePrivateKey(value?: string): string {
  return value?.replace(/\s/g, "").trim() ?? "";
}

function hashId(prefix: string, value: string, length = 24): string {
  const digest = createHash("sha256").update(value).digest("hex");
  return `${prefix}_${digest.slice(0, length)}`;
}

export function deriveOwnerIdFromPublicKey(publicKey: string): string {
  return hashId("owner", publicKey);
}

export function deriveAgentIdFromPrivateKey(privateKey: string): string {
  return hashId("agent", derivePublicKey(privateKey));
}

export function deriveVaultIdFromPublicKey(publicKey: string): string {
  return hashId("vault", publicKey, 32);
}

function resolveVaultDir(vaultId: string): string {
  const baseDir = process.env.C_BIO_VAULT_DIR || path.join(os.homedir(), ".c-bio");
  return path.join(baseDir, vaultId);
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

export type OwnerContext = {
  privateKey: string;
  publicKey: string;
  ownerId: string;
  agentId: string;
  vaultId: string;
  vaultDir: string;
  signer: LocalSigner;
  owner: VaultClient;
  vault: VaultService;
};

export async function loadOwnerContextFromPrivateKey(privateKey: string): Promise<OwnerContext> {
  const publicKey = derivePublicKey(privateKey);
  const ownerId = deriveOwnerIdFromPublicKey(publicKey);
  const agentId = hashId("agent", publicKey);
  const vaultId = deriveVaultIdFromPublicKey(publicKey);
  const vaultDir = resolveVaultDir(vaultId);
  const signer = new LocalSigner({ publicKey, privateKey });
  const storage = new FsStorageProvider(vaultDir);
  const ownerIdentity = restoreIdentity(privateKey);
  const vaultExists = await storage.has("vault/audit.jsonl");
  const initialized = vaultExists
    ? await recoverVault(storage, {
        vaultId,
        ownerIdentity,
      })
    : await createVault(storage, {
        vaultId,
        ownerIdentity,
      });
  const vault = initialized.vault;
  const clock = new SystemClock();

  await vault.bootstrapOwnerIdentity({
    vaultId: vault.vaultId,
    ownerId,
    publicKey,
  }).catch(() => {
    // Owner identity registries are process-scoped in 1.1.0, so repeated bootstrap
    // attempts can happen across CLI invocations without affecting disk state.
  });

  const owner = createVaultClient({ identityId: ownerId }, vault, signer, clock);

  return {
    privateKey,
    publicKey,
    ownerId,
    agentId,
    vaultId,
    vaultDir,
    signer,
    owner,
    vault,
  };
}

export async function loadOwnerContextFromEnvOrPrompt(prompt: string): Promise<OwnerContext> {
  const privateKey = await requirePrivateKeyFromEnvOrPrompt(prompt);
  return loadOwnerContextFromPrivateKey(privateKey);
}

export function createIdentityMaterial() {
  const { publicKey, privateKey } = createIdentity();
  const resolvedPublicKey = publicKey || derivePublicKey(privateKey);
  const ownerId = deriveOwnerIdFromPublicKey(resolvedPublicKey);
  const agentId = hashId("agent", resolvedPublicKey);
  const vaultId = deriveVaultIdFromPublicKey(resolvedPublicKey);

  return {
    privateKey,
    publicKey: resolvedPublicKey,
    ownerId,
    agentId,
    vaultId,
  };
}

export async function verifyVaultPersistence(publicKey: string, privateKey: string): Promise<string> {
  const vaultId = deriveVaultIdFromPublicKey(publicKey);
  const vaultDir = resolveVaultDir(vaultId);
  const storage = new FsStorageProvider(vaultDir);
  const ownerIdentity = restoreIdentity(privateKey);
  const vaultExists = await storage.has("vault/audit.jsonl");

  if (vaultExists) {
    await recoverVault(storage, {
      vaultId,
      ownerIdentity,
    });
  } else {
    await createVault(storage, {
      vaultId,
      ownerIdentity,
    });
  }

  return vaultDir;
}
