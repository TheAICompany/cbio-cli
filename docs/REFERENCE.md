# CLI Reference

Use this page when you want the exact behavior of each `cbio` command.

For overview and first-time setup, see [README.md](../README.md). For Claude Code and Cursor setup, see [QUICKSTART_AI_IDE.md](./QUICKSTART_AI_IDE.md).

Installable package: `@the-ai-company/cbio-cli`

Local binary name: `cbio`

## Core Commands

### `cbio init`

Creates a new identity, prints the public key, private key, and root agent ID, then checks that the vault path is writable.

Output includes:

- `Public Key`
- `Private Key`
- `Agent ID`
- vault path writability result

### `cbio tui`

Opens the interactive vault manager. You can:

- list secrets
- add secrets
- read secrets
- delete secrets
- inspect recent activity log entries

If `AGENT_PRIV_KEY` is not set, `cbio` prompts for it.

### `cbio proxy <upstream-url> [secret-name]`

Starts a local proxy that forwards requests to `upstream-url` and injects auth from the named secret.

Details:

- `secret-name` defaults to `default`
- `C_BIO_PROXY_PORT` can pin the local port
- the upstream URL must be `http://` or `https://`
- if `AGENT_PRIV_KEY` is missing, `cbio` prompts for it before startup

## Auxiliary Commands

### `cbio agent-id`

Prints the root agent ID for the private key in `AGENT_PRIV_KEY`. If `AGENT_PRIV_KEY` is missing, `cbio` prompts for the key.

### `cbio get <secret-name>`

Prints a secret in plaintext. This is a last-mile admin/debug command, not the normal way to connect tools.

### `cbio delete <secret-name>`

Deletes a secret after explicit confirmation.

## Environment Variables

- `AGENT_PRIV_KEY`: private key used to unlock or administer the vault
- `C_BIO_PROXY_PORT`: optional fixed local port for `proxy`
- `C_BIO_VAULT_DIR`: optional vault storage directory override

## Storage and Paths

- default vault storage is under `~/.c-bio/`
- `cbio tui` checks whether the vault already exists and reports whether it loaded or created the vault
- `C_BIO_VAULT_DIR` changes where vault files are read and written

## Practical Notes

- `get` prints plaintext, so treat it as a last-mile admin command rather than a normal integration method
- `delete` is destructive and requires confirmation
- `proxy` is the easiest path for tools that expect a base URL plus placeholder API key
