/**
 * TUI (Terminal User Interface) for Claw-biometric Owner vault management.
 * Interactive menu for list/add/get/delete secrets and view activity log.
 * Prompts for private key if AGENT_PRIV_KEY is not set. No external TUI dependencies; uses Node readline.
 */

import * as fs from 'node:fs/promises';
import * as readline from 'node:readline/promises';
import { CbioIdentity, derivePublicKey } from '@the-ai-company/cbio-node-runtime';
import { getVaultPath } from '@the-ai-company/cbio-node-runtime/protocol';
import { readSecretNoEcho } from '../../lib/terminal/readSecret.js';
import { selectFromMenu } from '../../lib/terminal/selectFromMenu.js';
import { runList, runAdd, runActivity } from './actions.js';

export async function runTui(): Promise<void> {
    let privKey = process.env.AGENT_PRIV_KEY?.replace(/\s/g, '').trim();
    if (!privKey) {
        privKey = (await readSecretNoEcho('AGENT_PRIV_KEY not set. Enter private key: ')).replace(/\s/g, '').trim();
        if (!privKey) {
            console.error('No key provided.');
            process.exit(1);
        }
    }

    const publicKey = derivePublicKey(privKey);
    const vaultPath = getVaultPath(publicKey);
    let vaultExisted = false;
    try {
        await fs.access(vaultPath);
        vaultExisted = true;
    } catch { /* not found */ }

    let identity: CbioIdentity;
    try {
        identity = await CbioIdentity.load({ privateKey: privKey });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('Invalid key:', msg);
        console.error('Ensure the key is complete (Ed25519 PKCS#8 base64url, ~68 chars). Paste without extra spaces or line breaks.');
        process.exit(1);
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const listNames = () => identity.listSecretNames();
    const ctx = { rl, owner: identity, listNames };

    const vaultMode = vaultExisted ? 'Loaded existing vault' : 'Created new vault';
    const vaultPathDisplay = vaultPath;
    const menuItems = (labels: string[]) => labels.map((l, i) => `${i}. ${l}`);

    while (true) {
        const names = listNames();
        const mainLabels = ['Quit', `List secrets [${names.length}]`, 'Add secret', 'Activity log'];
        const header = ['Claw-biometric', '', vaultMode, `Path: ${vaultPathDisplay}`];
        const choice = await selectFromMenu(header, menuItems(mainLabels));

        if (choice === 0) break;

        process.stdin.resume();
        switch (choice) {
            case 1:
                await runList(ctx);
                break;
            case 2:
                await runAdd(ctx);
                break;
            case 3:
                await runActivity(ctx);
                break;
            default:
                console.log('Invalid choice.');
        }
    }

    rl.close();
}
