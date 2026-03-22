# Claw-biometric (cbio) CLI

1Password for AI agents.

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
Finance-Agent: [CBIO] Unlocking 'finance-vault'... Using 'aws-readonly' identity.
Finance-Agent: [CBIO] Injecting auth... Fetching CloudWatch billing...
Finance-Agent: "Audit complete. I never saw the root AWS key."

Dev-Agent: "I'm deploying the new landing page to Vercel."
Dev-Agent: [CBIO] Unlocking 'dev-vault'... Using 'vercel-deploy' identity.
Dev-Agent: [CBIO] Injecting token... Pushing build...
Dev-Agent: "Deploy successful. Financial credentials remained physically isolated."

Boss: "Did the Finance Agent see the Vercel token?"
CBIO: "No. Keypairs are unique. Vaults are isolated. Trust is partitioned."
```

## Why this exists

In the era of 10,000 parallel agents, passing raw keys is an architectural failure. 

**Claw-biometric** is the sovereign identity layer for your agent team. It provides a physical isolation boundary between your **Agent's Logic** and your **Production Credentials**.

### Key Features
- **🔐 AES-256-GCM Vault**: 100% offline, encrypted at rest. No cloud backdoors.
- **🛡️ Physical Isolation**: Agents perform requests without ever seeing plaintext secrets.
- **🚧 KMS-Style Black-Box Vault (planned)**: moving toward a vault with no secret export, only proof-based operations.
- **⚡ Atomic Auto-Save**: Real-time, encrypted disk writes on every credential change.
- **🧩 Recursive Identity**: Issue and govern sub-identities with a master authority.
- **📜 Tamper-Evident Logs**: Audit every secret access with local activity logs.

### The Golden Rule
> **Agent logic should receive only the `agent` handle, never the `identity`.**
> If your agent process can read the raw private key (`AGENT_PRIV_KEY`) for the current identity, nothing can protect you from that process. Always separate the **Authority** (Identity) from the **Execution** (Agent).

---

## Quick Start: Zero to Sovereign

### 1. Install
```bash
npm install @the-ai-company/cbio-cli
```

### 2. Initialize your Identity
```bash
npx @the-ai-company/cbio-cli init
```
*Creates an identity and prints `AGENT_PUB_KEY`, `AGENT_PRIV_KEY`, `OWNER_ID`, `AGENT_ID`, and `VAULT_ID`.*
`OWNER_ID` is the owner identity derived from that keypair.
`AGENT_ID` is the default agent identity derived from the same keypair. It does not mean `init` created a separate running agent for you.

Security note: do not run `init` inside IDE terminals or tools that may record terminal output. Some IDEs can persist command output, which can leak the printed private key. Prefer a regular system terminal for this step.
After `init` succeeds, save the private key immediately and close the current session as soon as you are done with it.

After installation, the local binary name is still:

```bash
cbio init
```

### 3. Export your private key

```bash
export AGENT_PRIV_KEY=your_private_key_here
```

`AGENT_PRIV_KEY` means the private key for the identity used by the current shell or process. In a child-agent environment, that would be the child agent's own identity key.

### 4. Add a secret

```bash
cbio tui
```

### 5. Start a local auth proxy

```bash
cbio proxy https://api.openai.com openai
```

The proxy prints a local Base URL. Point your client or tool at that URL and use any placeholder API key value.

## How it works

CBIO keeps secrets in the local vault and injects auth at request time, so your tool can talk to a local endpoint without holding the raw provider key.

```text
 [ Agent Logic ] <--- (HALT) --- [ Isolation Boundary ]
      |                                   |
 (Fetch Name) ---> [ Claw-biometric Vault ] ---> (Inject Auth) ---> [ API Service ]
                      (Encrypted)                              (SSL)
```

---

## CLI Tools
- Installable package: `@the-ai-company/cbio-cli`
- Local binary: `cbio`
- Core flow: `cbio init`, `cbio tui`, `cbio proxy`
- `cbio init`: create your identity and print the keys you need to save
- `cbio tui`: open the owner console for vault, keys, agents, permissions, and audit
- `cbio proxy <upstream-url> [secret-name]`: expose a local endpoint that injects auth from the vault
- Auxiliary commands: `cbio agent-id`, `cbio get`, `cbio delete`
- `cbio agent-id`: print the derived agent ID for a private key
- `cbio get`: print a secret in plaintext for last-mile admin/debug work
- `cbio delete`: currently unavailable with the runtime 1.13 public API

---

## Explore the Ecosystem
- [docs/QUICKSTART_AI_IDE.md](./docs/QUICKSTART_AI_IDE.md): 30-second setup for Claude Code and Cursor.
- [docs/REFERENCE.md](./docs/REFERENCE.md): CLI command behavior, environment variables, and storage notes.

---

License: **MIT**
*Built for the Age of Autonomy.*
