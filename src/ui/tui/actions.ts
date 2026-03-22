/**
 * actions.ts
 * Menu action handlers for TUI. Each runs an Owner operation and prints result.
 */

import type * as readline from 'node:readline/promises';
import {
    addSecretIfMissing,
    getActivitySummary,
    getSecretValue,
    listRegisteredAgents,
    listRegisteredCapabilities,
    listSecretAliases,
    registerAgent,
    registerDispatchCapability,
    summarizeOwnerContext,
} from '../../application/tuiOwner.js';
import { question } from '../../lib/terminal/prompt.js';
import { selectFromMenu } from '../../lib/terminal/selectFromMenu.js';
import { formatActivityDetail, formatActivityListEntry } from './presenter.js';
import type { OwnerContext } from '../../application/identity.js';

export type ActionContext = {
    rl: readline.Interface;
    owner: OwnerContext;
};

function toMenuItems(labels: string[]): string[] {
    return labels.map((label, index) => `${index}. ${label}`);
}

export async function runVaultMenu(ctx: ActionContext): Promise<void> {
    while (true) {
        const summary = await summarizeOwnerContext(ctx.owner);
        process.stdin.resume();
        const header = [
            '--- Vault ---',
            `Vault: ${summary.vaultId}`,
            `Secrets: ${summary.secretCount}`,
            `Agents: ${summary.agentCount}`,
            `Capabilities: ${summary.capabilityCount}`,
        ];
        const choice = await selectFromMenu(header, toMenuItems([
            'Back',
            `List secrets [${summary.secretCount}]`,
            'Add secret',
        ]));

        if (choice === 0) return;
        if (choice === 1) await runSecretList(ctx);
        if (choice === 2) await runAddSecret(ctx);
    }
}

export async function runSecretList(ctx: ActionContext): Promise<void> {
    const secrets = await listSecretAliases(ctx.owner);
    if (secrets.length === 0) {
        console.log('No secrets.');
        return;
    }

    const secretActionLabels = ['Back', 'Get'];

    while (true) {
        const names = await listSecretAliases(ctx.owner);
        if (names.length === 0) {
            console.log('No secrets.');
            return;
        }
        process.stdin.resume();
        const listLabels = ['Back', ...names.map((s) => `"${s}"`)];
        const listItems = toMenuItems(listLabels);
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
                const v = await getSecretValue(ctx.owner, secretName);
                if (v !== undefined) console.log(`[${secretName}]:`, v);
                else console.log(`Not found: "${secretName}"`);
            }
        }
    }
}

export async function runAddSecret(ctx: ActionContext): Promise<void> {
    const name = await question(ctx.rl, 'Secret name');
    if (!name) { console.log('Cancelled.'); return; }
    const value = await question(ctx.rl, 'Secret value');
    if (!value) { console.log('Cancelled.'); return; }
    const targetUrl = await question(ctx.rl, 'Allowed target URL');
    if (!targetUrl) { console.log('Cancelled.'); return; }
    const method = await question(ctx.rl, 'Allowed method (optional)');
    const result = await addSecretIfMissing(ctx.owner, name, value, targetUrl, method || undefined);
    if (!result.ok) {
        console.log(result.message);
        return;
    }
    console.log(`Added "${name}".`);
}

export async function runKeysMenu(ctx: ActionContext): Promise<void> {
    while (true) {
        process.stdin.resume();
        const header = [
            '--- Keys ---',
            `AGENT_PUB_KEY=${ctx.owner.publicKey}`,
            `OWNER_ID=${ctx.owner.ownerId}`,
            `AGENT_ID=${ctx.owner.agentId}`,
            `VAULT_ID=${ctx.owner.vaultId}`,
        ];
        const choice = await selectFromMenu(header, toMenuItems([
            'Back',
            'Reveal AGENT_PRIV_KEY',
        ]));

        if (choice === 0) return;
        if (choice === 1) {
            console.log(`AGENT_PRIV_KEY=${ctx.owner.privateKey}`);
            await question(ctx.rl, 'Press Enter to continue');
        }
    }
}

export async function runAgentsMenu(ctx: ActionContext): Promise<void> {
    while (true) {
        const agents = await listRegisteredAgents(ctx.owner);
        process.stdin.resume();
        const header = ['--- Agents ---', `Registered agents: ${agents.length}`];
        const choice = await selectFromMenu(header, toMenuItems([
            'Back',
            `List agents [${agents.length}]`,
            'Register agent',
        ]));

        if (choice === 0) return;
        if (choice === 1) {
            if (agents.length === 0) {
                console.log('No registered agents.');
            } else {
                for (const agent of agents) {
                    console.log(`${agent.agentId}  ${agent.occurredAt}`);
                }
            }
            await question(ctx.rl, 'Press Enter to continue');
        }
        if (choice === 2) {
            const agentId = await question(ctx.rl, 'Agent ID');
            if (!agentId) { console.log('Cancelled.'); continue; }
            const publicKey = await question(ctx.rl, 'Agent public key');
            if (!publicKey) { console.log('Cancelled.'); continue; }
            await registerAgent(ctx.owner, agentId, publicKey);
            console.log(`Registered agent "${agentId}".`);
        }
    }
}

export async function runPermissionsMenu(ctx: ActionContext): Promise<void> {
    while (true) {
        const capabilities = await listRegisteredCapabilities(ctx.owner);
        process.stdin.resume();
        const header = ['--- Permissions ---', `Capabilities: ${capabilities.length}`];
        const choice = await selectFromMenu(header, toMenuItems([
            'Back',
            `List capabilities [${capabilities.length}]`,
            'Register HTTP capability',
        ]));

        if (choice === 0) return;
        if (choice === 1) {
            if (capabilities.length === 0) {
                console.log('No registered capabilities.');
            } else {
                for (const capability of capabilities) {
                    console.log(`${capability.capabilityId}  ${capability.operation}  ${capability.occurredAt}`);
                }
            }
            await question(ctx.rl, 'Press Enter to continue');
        }
        if (choice === 2) {
            const capabilityId = await question(ctx.rl, 'Capability ID');
            if (!capabilityId) { console.log('Cancelled.'); continue; }
            const agentId = await question(ctx.rl, 'Agent ID');
            if (!agentId) { console.log('Cancelled.'); continue; }
            const secretAlias = await question(ctx.rl, 'Secret alias');
            if (!secretAlias) { console.log('Cancelled.'); continue; }
            const targetUrl = await question(ctx.rl, 'Allowed target URL');
            if (!targetUrl) { console.log('Cancelled.'); continue; }
            const method = await question(ctx.rl, 'Allowed method', 'POST');
            const expiresAt = await question(ctx.rl, 'Expires at ISO timestamp (optional)');
            await registerDispatchCapability(ctx.owner, {
                capabilityId,
                agentId,
                secretAlias,
                targetUrl,
                method: method || 'POST',
                expiresAt: expiresAt || undefined,
            });
            console.log(`Registered capability "${capabilityId}".`);
        }
    }
}

export async function runActivity(ctx: ActionContext): Promise<void> {
    const { recentEntries, actorId } = await getActivitySummary(ctx.owner);

    while (true) {
        process.stdin.resume();
        const listLabels = recentEntries.length === 0
            ? ['Back']
            : ['Back', ...recentEntries.map((e) => formatActivityListEntry(e as unknown as Record<string, unknown>, actorId))];
        const items = toMenuItems(listLabels);
        const header = recentEntries.length === 0 ? ['--- Activity Log ---', 'No activity.'] : ['--- Activity Log ---'];
        const choice = await selectFromMenu(header, items);

        if (choice === 0) return;

        const entry = recentEntries[choice - 1];
        if (!entry) return;
        const detailLines = formatActivityDetail(entry as unknown as Record<string, unknown>, actorId);
        process.stdin.resume();
        const detailHeader = ['--- Detail ---', ...detailLines];
        await selectFromMenu(detailHeader, toMenuItems(['Back']));
    }
}
