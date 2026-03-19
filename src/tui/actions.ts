/**
 * actions.ts
 * Menu action handlers for TUI. Each runs an Owner operation and prints result.
 */

import type * as readline from 'node:readline/promises';
import type { CbioIdentity } from '@the-ai-company/cbio-node-runtime';
import { deriveRootAgentId } from '@the-ai-company/cbio-node-runtime/protocol';
import { question } from './prompt.js';
import { selectFromMenu } from './selectFromMenu.js';

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
                const v = ctx.owner.admin.vault.getSecret(secretName);
                if (v !== undefined) console.log(`[${secretName}]:`, v);
                else console.log(`Not found: "${secretName}"`);
            } else if (actionChoice === 2) {
                const confirm = await question(ctx.rl, `Delete "${secretName}"? (y/N)`, 'n');
                if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
                    try {
                        await ctx.owner.admin.vault.deleteSecret(secretName);
                        console.log(`Deleted "${secretName}".`);
                    } catch (e: unknown) {
                        console.error('Delete failed:', e instanceof Error ? e.message : String(e));
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
    if (ctx.owner.hasSecret(name)) {
        console.log(`Secret "${name}" already exists.`);
        return;
    }
    const value = await question(ctx.rl, 'Secret value');
    if (!value) { console.log('Cancelled.'); return; }
    await ctx.owner.admin.vault.addSecret(name, value);
    console.log(`Added "${name}".`);
}

function formatTsRelative(ts: number): string | null {
    const d = Date.now() - ts;
    if (d < 60_000) return `${Math.floor(d / 1000)}s ago`;
    if (d < 3600_000) return `${Math.floor(d / 60_000)}m ago`;
    if (d < 86400_000) return `${Math.floor(d / 3600_000)}h ago`;
    if (d < 86400_000 * 7) return `${Math.floor(d / 86400_000)}d ago`;
    return null;
}

function formatAgentIdShort(agentId: string): string {
    const i = agentId.indexOf('_');
    if (i < 0) return agentId.length > 12 ? agentId.slice(0, 6) + '...' + agentId.slice(-3) : agentId;
    const prefix = agentId.slice(0, i + 1);
    const id = agentId.slice(i + 1);
    if (id.length <= 9) return agentId;
    return prefix + id.slice(0, 3) + '...' + id.slice(-3);
}

function formatActivityListEntry(e: Record<string, unknown>, agentId: string): string {
    const parts: string[] = [];
    if (typeof e.ts === 'number') {
        const d = new Date(e.ts);
        const abs = d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const rel = formatTsRelative(e.ts);
        parts.push(abs, rel ? `(${rel})` : '');
    }
    parts.push(formatAgentIdShort(agentId));
    parts.push(String(e.action ?? ''));
    parts.push(String(e.secretName ?? ''));
    return parts.filter(Boolean).join(' ');
}

function formatActivityDetail(entry: Record<string, unknown>, agentId: string): string[] {
    const formatted: Record<string, unknown> = { ...entry, agentId };
    if (typeof formatted.ts === 'number') {
        const d = new Date(formatted.ts);
        const abs = d.toLocaleString();
        const rel = formatTsRelative(formatted.ts);
        formatted.ts = rel ? `${abs} (${rel})` : abs;
    }
    return Object.entries(formatted).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`);
}

export async function runActivity(ctx: ActionContext): Promise<void> {
    const entries = await ctx.owner.admin.vault.getActivityLog();
    const recent = entries.slice(-20);
    const publicKey = await ctx.owner.getPublicKey();
    const agentId = deriveRootAgentId(publicKey);

    while (true) {
        process.stdin.resume();
        const listLabels = recent.length === 0
            ? ['Back']
            : ['Back', ...recent.map((e) => formatActivityListEntry(e as unknown as Record<string, unknown>, agentId))];
        const items = listLabels.map((l, i) => `${i}. ${l}`);
        const header = recent.length === 0 ? ['--- Activity Log ---', 'No activity.'] : ['--- Activity Log ---'];
        const choice = await selectFromMenu(header, items);

        if (choice === 0) return;

        const entry = recent[choice - 1];
        if (!entry) return;
        const detailLines = formatActivityDetail(entry as unknown as Record<string, unknown>, agentId);
        process.stdin.resume();
        const detailHeader = ['--- Detail ---', ...detailLines];
        await selectFromMenu(detailHeader, ['Back'].map((l, i) => `${i}. ${l}`));
    }
}
