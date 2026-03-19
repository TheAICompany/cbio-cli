# 30-Second Quickstart: Claude Code & Cursor

Use your AI IDE with API keys stored in the vault. You do a few one-time steps; the LLM works normally afterward.

## Human steps (one-time)

### 1. Install and init

```bash
npm install -g @the-ai-company/cbio-cli
npx cbio-identity init
```

Save the Private Key. Set `AGENT_PRIV_KEY` in your environment (e.g. `export AGENT_PRIV_KEY=...`) before running `tui` or `proxy`.

### 2. Add secret to vault

```bash
cbio-identity tui
```

Add a secret (e.g. `anthropic` for Claude, `openai` for OpenAI). Paste your API key when prompted.

### 3. Start the proxy

**For Anthropic (Claude):**
```bash
cbio-identity proxy https://api.anthropic.com anthropic
```

**For OpenAI:**
```bash
cbio-identity proxy https://api.openai.com openai
```

Note the **Base URL** printed (e.g. `http://127.0.0.1:54321`). Keep this terminal running.

### 4. Point your IDE at the proxy

---

## Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:YOUR_PORT",
    "ANTHROPIC_API_KEY": "unused"
  }
}
```

Replace `YOUR_PORT` with the port from the proxy output. The proxy injects the real key from the vault.

---

## Cursor

1. Open **Settings** → **Models**
2. For **Anthropic**: Enable "Override Anthropic Base URL", set to `http://127.0.0.1:YOUR_PORT`
3. For **OpenAI**: Enable "Override OpenAI Base URL", set to `http://127.0.0.1:YOUR_PORT/v1`
4. Use a placeholder API key (e.g. `unused`); the proxy injects the real one.

---

## After setup

Use Claude Code or Cursor as usual. The proxy forwards requests and injects auth from the vault. Your API key never appears in IDE config or logs.
