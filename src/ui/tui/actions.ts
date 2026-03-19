/**
 * actions.ts
 * Menu action handlers for TUI. Each runs an Owner operation and prints result.
 */

import type * as readline from 'node:readline/promises';
import type { CbioIdentity } from '@the-ai-company/cbio-node-runtime';
import {
    addSecretIfMissing,
    deleteSecretWithResult,
    getActivitySummary,
    getSecretValue,
} from '../../application/tuiVault.js';
import { question } from '../../lib/terminal/prompt.js';
import { selectFromMenu } from '../../lib/terminal/selectFromMenu.js';
import { formatActivityDetail, formatActivityListEntry } from './presenter.js';

export type ActionContext = {
    rl: readline.Interface;
    owner: CbioIdentity;
    listNames: () => string[];
};

export async function runList(ctx: ActionContext): Promise<void> {
    const secrets = ctx.listNames();
    if (secrets.length === 0) {
        console.log('No secrets.');
        return;
    }

    const secretActionLabels = ['Back', 'Get', 'Delete'];

    while (true) {
        const names = ctx.listNames();
        if (names.length === 0) {
            console.log('No secrets.');
            return;
        }
        process.stdin.resume();
        const listLabels = ['Back', ...names.map((s) => `"${s}"`)];
        const listItems = listLabels.map((l, i) => `${i}. ${l}`);
        const header = ['--- Secrets ---'];
        const choice = await selectFromMenu(header, listItems);

        if (choice === 0) return;

        const secretName = names[choice - 1];
        process.stdin.resume();

        while (true) {
            const actionHeader = [`--- ${secretName} ---`];
            const actionItems = secretActionLabels.map((l, i) => `${i}. ${l}`);
            const actionChoice = await selectFromMenu(actionHeader, actionItems);

            if (actionChoice === 0) break;

            process.stdin.resume();
            if (actionChoice === 1) {
                const v = getSecretValue(ctx.owner, secretName);
                if (v !== undefined) console.log(`[${secretName}]:`, v);
                else console.log(`Not found: "${secretName}"`);
            } else if (actionChoice === 2) {
                const confirm = await question(ctx.rl, `Delete "${secretName}"? (y/N)`, 'n');
                if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
                    const result = await deleteSecretWithResult(ctx.owner, secretName);
                    if (result.ok) {
                        console.log(`Deleted "${secretName}".`);
                    } else {
                        console.error('Delete failed:', result.error);
                    }
                    await question(ctx.rl, 'Press Enter to continue');
                    process.stdin.resume();
                    if (ctx.listNames().length === 0) return;
                    break;
                }
                console.log('Cancelled.');
                await question(ctx.rl, 'Press Enter to continue');
            }
        }
    }
}

export async function runAdd(ctx: ActionContext): Promise<void> {
    const name = await question(ctx.rl, 'Secret name');
    if (!name) { console.log('Cancelled.'); return; }
    const value = await question(ctx.rl, 'Secret value');
    if (!value) { console.log('Cancelled.'); return; }
    const result = await addSecretIfMissing(ctx.owner, name, value);
    if (!result.ok) {
        console.log(result.message);
        return;
    }
    console.log(`Added "${name}".`);
}

export async function runActivity(ctx: ActionContext): Promise<void> {
    const { recentEntries, agentId } = await getActivitySummary(ctx.owner);

    while (true) {
        process.stdin.resume();
        const listLabels = recentEntries.length === 0
            ? ['Back']
            : ['Back', ...recentEntries.map((e) => formatActivityListEntry(e as unknown as Record<string, unknown>, agentId))];
        const items = listLabels.map((l, i) => `${i}. ${l}`);
        const header = recentEntries.length === 0 ? ['--- Activity Log ---', 'No activity.'] : ['--- Activity Log ---'];
        const choice = await selectFromMenu(header, items);

        if (choice === 0) return;

        const entry = recentEntries[choice - 1];
        if (!entry) return;
        const detailLines = formatActivityDetail(entry as unknown as Record<string, unknown>, agentId);
        process.stdin.resume();
        const detailHeader = ['--- Detail ---', ...detailLines];
        await selectFromMenu(detailHeader, ['Back'].map((l, i) => `${i}. ${l}`));
    }
}
