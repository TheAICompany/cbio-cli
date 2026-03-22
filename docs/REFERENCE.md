# CLI Reference

Use this page when you want the exact behavior of each `cbio` command.

For overview and first-time setup, see [README.md](../README.md). For Claude Code and Cursor setup, see [QUICKSTART_AI_IDE.md](./QUICKSTART_AI_IDE.md).

Installable package: `@the-ai-company/cbio-cli`

Local binary name: `cbio`

## Core Commands

### `cbio init`

Creates a new identity, prints the public key, private key, owner ID, agent ID, and vault ID, then checks that the vault path is writable.
The output uses copy-friendly variable names: `AGENT_PUB_KEY`, `AGENT_PRIV_KEY`, `OWNER_ID`, `AGENT_ID`, and `VAULT_ID`.
`OWNER_ID` is the owner identity derived from that keypair.
`AGENT_ID` is the default agent identifier derived from the same keypair. It does not mean `cbio init` created a separate running agent instance.

Security note: `cbio init` prints the private key to the terminal. Do not run it in terminals or IDEs that may record output history.
After `cbio init` succeeds, save the private key immediately and close the current session as soon as you are done with it.

Output includes:

- `AGENT_PUB_KEY`
- `AGENT_PRIV_KEY`
- `OWNER_ID`
- `AGENT_ID`
- `VAULT_ID`
- vault path writability result

### `cbio tui`

Opens the owner console. You can:

- inspect the vault summary
- list and add secrets
- reveal current owner key material when needed
- register agents
- register HTTP capabilities for agents
- inspect recent audit entries

If `AGENT_PRIV_KEY` is not set, `cbio` prompts for it.

### `cbio proxy <upstream-url> [secret-name]`

Starts a local proxy that forwards requests to `upstream-url` and injects auth from the named secret.

Details:

- `secret-name` defaults to `default`
- `C_BIO_PROXY_PORT` can pin the local port
- if `C_BIO_PROXY_PORT` is not set, `cbio` asks the OS for an ephemeral local port and prints the chosen `Base URL`
- outbound auth uses `Authorization: Bearer <secret>` by default
- the incoming request path and query string are forwarded onto the upstream base URL
- the upstream URL must be `http://` or `https://`
- if `AGENT_PRIV_KEY` is missing, `cbio` prompts for it before startup

## Auxiliary Commands

### `cbio agent-id`

Prints the derived agent ID for the private key in `AGENT_PRIV_KEY`. If `AGENT_PRIV_KEY` is missing, `cbio` prompts for the key.

### `cbio get <secret-name>`

Prints a secret in plaintext. This is a last-mile admin/debug command, not the normal way to connect tools.

### `cbio delete <secret-name>`

Not available in the runtime `1.13` public API. The command exits with an error.

## Environment Variables

- `AGENT_PRIV_KEY`: private key for the identity used by the current shell or process; `cbio` uses it to unlock or administer that identity's vault
- `C_BIO_PROXY_PORT`: optional fixed local port for `proxy`
- `C_BIO_VAULT_DIR`: optional vault storage directory override

## Storage and Paths

- default vault storage is under `~/.c-bio/`
- `cbio tui` checks whether the vault already exists and reports whether it loaded or created the vault
- `C_BIO_VAULT_DIR` changes where vault files are read and written

## Practical Notes

- `get` prints plaintext, so treat it as a last-mile admin command rather than a normal integration method
- `delete` is currently unavailable because the runtime `1.13` public API does not expose secret deletion
- `proxy` is the easiest path for tools that expect a base URL plus placeholder API key
