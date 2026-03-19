#!/usr/bin/env node
import process from "node:process";
import * as readline from "node:readline/promises";
import { CbioIdentity, startLocalAuthProxy, generateIdentityKeys } from "@the-ai-company/cbio-node-runtime";
import { getVaultPath, deriveRootAgentId } from "@the-ai-company/cbio-node-runtime/protocol";
import { derivePublicKey } from "@the-ai-company/cbio-node-runtime";
import { runTui } from "./tui/index.js";
import { readSecretNoEcho } from "./tui/readSecret.js";

const cmd = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

function isValidHttpUrl(s: string): boolean {
    try {
        const u = new URL(s);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

async function runCli() {
  if (cmd === "tui") {
    await runTui();
    return;
  }
  if (cmd === "proxy" && arg1) {
    const upstreamBaseUrl = arg1.trim();
    if (!isValidHttpUrl(upstreamBaseUrl)) {
      console.error(`❌ Invalid upstream URL: "${arg1}". Must be a valid http:// or https:// URL.`);
      process.exit(1);
    }

    let privKey = process.env.AGENT_PRIV_KEY?.replace(/\s/g, "").trim();
    if (!privKey) {
      privKey = (await readSecretNoEcho("AGENT_PRIV_KEY not set. Enter private key: ")).replace(/\s/g, "").trim();
      if (!privKey) {
        console.error("No key provided.");
        process.exit(1);
      }
    }

    const secretName = arg2 || 'default';
    const port = process.env.C_BIO_PROXY_PORT ? Number(process.env.C_BIO_PROXY_PORT) : 0;
    if (Number.isNaN(port)) {
      console.error("❌ Error: C_BIO_PROXY_PORT must be a valid number.");
      process.exit(1);
    }

    const identity = await CbioIdentity.load({ privateKey: privKey });
    const handle = await startLocalAuthProxy({
      authHandle: identity,
      secretName,
      upstreamBaseUrl,
      port,
    });

    console.log(`c-bio local auth proxy started`);
    console.log(`Upstream:   ${handle.upstreamBaseUrl}`);
    console.log(`Secret:     ${handle.secretName}`);
    console.log(`Base URL:   ${handle.baseUrl}`);
    console.log(``);
    console.log(`Point your client at the local Base URL and omit the raw API key from agent logic.`);
    console.log(`Press Ctrl+C to stop.`);

    const shutdown = async () => {
      await handle.close().catch(() => {});
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    return;
  }
  if (cmd === "agent-id") {
    let privKey = process.env.AGENT_PRIV_KEY?.replace(/\s/g, "").trim();
    if (!privKey) {
      privKey = (await readSecretNoEcho("AGENT_PRIV_KEY not set. Enter private key: ")).replace(/\s/g, "").trim();
      if (!privKey) {
        console.error("No key provided.");
        process.exit(1);
      }
    }
    const publicKey = derivePublicKey(privKey);
    const agentId = deriveRootAgentId(publicKey);
    console.log(agentId);
    return;
  }
  if (cmd === "init") {
    const { publicKey, privateKey } = generateIdentityKeys();
    const resolvedPublicKey = publicKey || derivePublicKey(privateKey);
    const agentId = deriveRootAgentId(resolvedPublicKey);

    console.log("=== Claw-biometric Identity Initialized ===");
    console.log("Public Key: ", resolvedPublicKey);
    console.log("Private Key:", privateKey);
    console.log("Agent ID:   ", agentId);
    console.log("---------------------------------");
    console.log("Keep your Private Key safe! It never leaves your machine.");

    try {
      await CbioIdentity.load({ publicKey: resolvedPublicKey, privateKey });
      console.log("✅ Vault path is writable:", getVaultPath(resolvedPublicKey));
    } catch (e: any) {
      console.log("\n⚠️  WARNING: Vault persistence setup failed.");
      console.log(e.message);
    }
  } else if (cmd === "get" && arg1) {
    const privKey = process.env.AGENT_PRIV_KEY;
    if (!privKey) {
      console.error("❌ Error: AGENT_PRIV_KEY environment variable is required to access the vault.");
      process.exit(1);
    }

    try {
      const identity = await CbioIdentity.load({ privateKey: privKey });
      const secret = identity.admin.vault.getSecret(arg1);
      if (secret) {
        console.log(`[${arg1}]:`, secret);
      } else {
        console.log(`❌ Error: Secret name "${arg1}" not found in vault.`);
      }
    } catch (e: any) {
      console.error("❌ Error accessing vault:", e.message);
    }
  } else if (cmd === "delete" && arg1) {
    const privKey = process.env.AGENT_PRIV_KEY;
    if (!privKey) {
      console.error("❌ Error: AGENT_PRIV_KEY environment variable is required to modify the vault.");
      process.exit(1);
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await rl.question(`⚠️  DANGER: Are you sure you want to permanently DELETE "${arg1}"? (y/N): `);
    rl.close();

    if (answer.toLowerCase() === "y") {
      try {
        const identity = await CbioIdentity.load({ privateKey: privKey });
        await identity.admin.vault.deleteSecret(arg1);
        console.log(`✅ Success: Secret "${arg1}" has been physically destroyed.`);
      } catch (e: any) {
        console.error("❌ Error deleting secret:", e.message);
      }
    } else {
      console.log("Operation cancelled.");
    }
  } else {
    console.log("Usage:");
    console.log("  cbio-identity init           Initialize a new identity");
    console.log("  cbio-identity agent-id      Derive Agent ID from private key (AGENT_PRIV_KEY or prompt)");
    console.log("  cbio-identity proxy <upstream-url> [secret-name]  Start a local auth proxy for any upstream API");
    console.log("  cbio-identity tui            Interactive vault management (Requires AGENT_PRIV_KEY)");
    console.log("  cbio-identity get <secret-name>    Extract a secret in plaintext (Requires AGENT_PRIV_KEY)");
    console.log("  cbio-identity delete <secret-name> Permanently destroy a secret (Requires AGENT_PRIV_KEY)");
  }
}

runCli().catch(console.error);
