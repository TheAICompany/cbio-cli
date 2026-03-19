# AI IDE Quickstart

Use this flow when you want Claude Code or Cursor to call provider APIs through a local CBIO proxy instead of storing raw API keys in IDE settings.

## One-Time Setup

### 1. Install the CLI and create an identity

```bash
npm install -g @the-ai-company/cbio-cli
cbio init
```

If you do not want to install globally, use:

```bash
npx @the-ai-company/cbio-cli init
```

Save the private key, then export it:

```bash
export AGENT_PRIV_KEY=your_private_key_here
```

### 2. Add a provider secret to the vault

```bash
cbio tui
```

Recommended secret names:

- `anthropic` for Anthropic / Claude
- `openai` for OpenAI

### 3. Start the local proxy

For Anthropic:

```bash
cbio proxy https://api.anthropic.com anthropic
```

For OpenAI:

```bash
cbio proxy https://api.openai.com openai
```

Keep that terminal running. The command prints a local `Base URL` such as `http://127.0.0.1:54321`.

## Claude Code

Add this to `~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:YOUR_PORT",
    "ANTHROPIC_API_KEY": "unused"
  }
}
```

Replace `YOUR_PORT` with the port shown by `cbio proxy`.

## Cursor

Open `Settings -> Models` and set:

- Anthropic base URL override to `http://127.0.0.1:YOUR_PORT`
- OpenAI base URL override to `http://127.0.0.1:YOUR_PORT/v1`
- API key to any placeholder value such as `unused`

## What Happens After Setup

Your IDE keeps talking to an OpenAI- or Anthropic-compatible endpoint, but the local CBIO proxy injects the real credential from the vault on outbound requests.

That means:

- the real API key does not live in IDE config
- the real API key does not need to be copied into prompts
- secret rotation happens in the vault, not in every tool config

## Troubleshooting

- If `tui` or `proxy` prompts for a key, `AGENT_PRIV_KEY` is not set in the current shell.
- If the IDE cannot connect, confirm the proxy process is still running.
- If requests fail with auth errors, verify the secret name you passed to `proxy` matches the name stored in the vault.
