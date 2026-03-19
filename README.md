# @the-ai-company/cbio-cli

**Stop giving your agents raw API keys.**

---

`The Amateur Way:`
You pass a raw string `sk_live_...` into your agent's tool or prompt.
- **Result:** The key leaks into logs, traces, and prompt injection "jailbreaks". Your agent is a **security liability**.

`The Sovereign Way:`
Your agent has an **Identity**. It uses secret names without ever seeing the plaintext keys.
- **Result:** Your agent acts as a **Certified Operator**. Credentials stay in the "Dark Room" (the vault). Your agent is a **production-grade asset**.

---

## See it work: The Sovereign Team

In a production environment, you don't have one "God Agent". You have a team of specialists.

```text
Finance-Agent: "I need to audit last month's AWS spend."
Finance-Agent: [SDK] Unlocking 'finance-vault'... Using 'aws-readonly' identity.
Finance-Agent: [SDK] Injecting auth... Fetching CloudWatch billing...
Finance-Agent: "Audit complete. I never saw the root AWS key."

Dev-Agent: "I'm deploying the new landing page to Vercel."
Dev-Agent: [SDK] Unlocking 'dev-vault'... Using 'vercel-deploy' identity.
Dev-Agent: [SDK] Injecting token... Pushing build...
Dev-Agent: "Deploy successful. Financial credentials remained physically isolated."

Boss: "Did the Finance Agent see the Vercel token?"
SDK: "No. Keypairs are unique. Vaults are isolated. Trust is partitioned."
```

## Why this exists

In the era of 10,000 parallel agents, passing raw keys is an architectural failure. 

**Claw-biometric** is the sovereign identity layer for your agent team. It provides a physical isolation boundary between your **Agent's Logic** and your **Production Credentials**.

### Key Features
- **🔐 AES-256-GCM Vault**: 100% offline, encrypted at rest. No cloud backdoors.
- **🛡️ Physical Isolation**: Agents perform requests without ever seeing plaintext secrets.
- **⚡ Atomic Auto-Save**: Real-time, encrypted disk writes on every credential change.
- **🧩 Recursive Identity**: Issue and govern sub-identities with a master authority.
- **📜 Tamper-Evident Logs**: Audit every secret access with local activity logs.

### The Golden Rule
> **Agent logic should receive only the `agent` handle, never the `identity`.**
> If your agent process can read the raw private key (`AGENT_PRIV_KEY`), the SDK cannot protect you from that process. Always separate the **Authority** (Identity) from the **Execution** (Agent).

---

## Quick Start: Zero to Sovereign

### 1. Install
```bash
# CLI tools (cbio-identity)
npm install @the-ai-company/cbio-cli

# For programmatic use, install the runtime
npm install @the-ai-company/cbio-node-runtime
```

### 2. Initialize your Identity
```bash
npx cbio-identity init
```
*Creates your root identity. Save the Private Key as `AGENT_PRIV_KEY`.*

### 3. Load the Agent
```ts
import { CbioIdentity } from '@the-ai-company/cbio-node-runtime';

// One identity. Full sovereignty.
const identity = await CbioIdentity.load({
  privateKey: process.env.AGENT_PRIV_KEY!,
});
```

### 4. Execute with Isolation
```ts
// The Agent uses the secret name. The SDK injects the auth. 
// The LLM never sees the 'openai-key' value.
const agent = identity.getAgent();
const response = await agent.fetchWithAuth(
  'openai-key',
  'https://api.openai.com/v1/models'
);
```

---

## The Architecture of Trust

The SDK enforces a **Physical Isolation Boundary**. Authing happens inside the SDK's fetch internal, outside the context window of the LLM.

```text
 [ Agent Logic ] <--- (HALT) --- [ Isolation Boundary ]
      |                                   |
 (Fetch Name) ---> [ Claw-biometric Vault ] ---> (Inject Auth) ---> [ API Service ]
                      (Encrypted)                              (SSL)
```

### Capability Matrix

The SDK enforces a **Capability Matrix** centered on Identity Governance:

- **Scoped Authority (`agent.xxx`)**: The default safe mode. Granted specific capabilities (e.g., `vault:fetch`). No private key export.
- **Root Authority (`identity.admin.xxx`)**: The high-privilege mode. Only for initialization, backup, and auditing.

---

## CLI Tools
- `cbio-identity init`: Provision a new identity.
- `cbio-identity tui`: Interactive vault manager.
- `cbio-identity proxy <upstream-url> [secret-name]`: Local auth broker for SDKs that do not support custom fetch.
- `cbio-identity get/delete <name>`: Quick admin tools.

---

## Explore the Ecosystem
- [docs/QUICKSTART_AI_IDE.md](./docs/QUICKSTART_AI_IDE.md): 30-second setup for Claude Code and Cursor.
- [docs/REFERENCE.md](./docs/REFERENCE.md): Advanced API, custom storage, and error reference.
- [examples/minimal.ts](./examples/minimal.ts): Copy-pasteable starters.

---

License: **MIT**
*Built for the Age of Autonomy.*
