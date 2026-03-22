/**
 * Owner console TUI for Claw-biometric.
 * Focused on vault, keys, agents, permissions, and audit.
 */

import * as fs from 'node:fs/promises';
import * as readline from 'node:readline/promises';
import { derivePublicKey } from '@the-ai-company/cbio-node-runtime';
import { selectFromMenu } from '../../lib/terminal/selectFromMenu.js';
import { runActivity, runAgentsMenu, runKeysMenu, runPermissionsMenu, runVaultMenu } from './actions.js';
import { loadOwnerContextFromEnvOrPrompt, deriveVaultIdFromPublicKey } from '../../application/identity.js';

export async function runTui(): Promise<void> {
    const context = await loadOwnerContextFromEnvOrPrompt('AGENT_PRIV_KEY not set. Enter private key: ');
    const publicKey = derivePublicKey(context.privateKey);
    const vaultPath = context.vaultDir;
    let vaultExisted = false;
    try {
        await fs.access(vaultPath);
        vaultExisted = true;
    } catch { /* not found */ }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ctx = { rl, owner: context };

    const vaultMode = vaultExisted ? 'Loaded existing vault' : 'Created new vault';
    const vaultPathDisplay = `${vaultPath} (${deriveVaultIdFromPublicKey(publicKey)})`;
    const menuItems = (labels: string[]) => labels.map((l, i) => `${i}. ${l}`);

    while (true) {
        const mainLabels = ['Quit', 'Vault', 'Keys', 'Agents', 'Permissions', 'Audit'];
        const header = ['Claw-biometric Owner Console', '', vaultMode, `Path: ${vaultPathDisplay}`];
        const choice = await selectFromMenu(header, menuItems(mainLabels));

        if (choice === 0) break;

        process.stdin.resume();
        switch (choice) {
            case 1:
                await runVaultMenu(ctx);
                break;
            case 2:
                await runKeysMenu(ctx);
                break;
            case 3:
                await runAgentsMenu(ctx);
                break;
            case 4:
                await runPermissionsMenu(ctx);
                break;
            case 5:
                await runActivity(ctx);
                break;
            default:
                console.log('Invalid choice.');
        }
    }

    rl.close();
}
