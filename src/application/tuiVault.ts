import { deriveRootAgentId } from '@the-ai-company/cbio-node-runtime/protocol';
import type { CbioIdentity } from '@the-ai-company/cbio-node-runtime';

type ActivityEntry = Awaited<ReturnType<CbioIdentity['admin']['vault']['getActivityLog']>>[number];

export function getSecretValue(identity: CbioIdentity, secretName: string): string | undefined {
    return identity.admin.vault.getSecret(secretName);
}

export async function deleteSecretWithResult(identity: CbioIdentity, secretName: string): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        await identity.admin.vault.deleteSecret(secretName);
        return { ok: true };
    } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
}

export async function addSecretIfMissing(
    identity: CbioIdentity,
    secretName: string,
    secretValue: string
): Promise<{ ok: true } | { ok: false; message: string }> {
    if (identity.hasSecret(secretName)) {
        return { ok: false, message: `Secret "${secretName}" already exists.` };
    }

    await identity.admin.vault.addSecret(secretName, secretValue);
    return { ok: true };
}

export async function getActivitySummary(identity: CbioIdentity): Promise<{ recentEntries: ActivityEntry[]; agentId: string }> {
    const entries = await identity.admin.vault.getActivityLog();
    const publicKey = await identity.getPublicKey();

    return {
        recentEntries: entries.slice(-20),
        agentId: deriveRootAgentId(publicKey),
    };
}
