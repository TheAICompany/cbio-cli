function formatTsRelative(ts: number, now = Date.now()): string | null {
    const d = now - ts;
    if (d < 60_000) return `${Math.floor(d / 1000)}s ago`;
    if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
    if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
    if (d < 86_400_000 * 7) return `${Math.floor(d / 86_400_000)}d ago`;
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

export function formatActivityListEntry(
    entry: Record<string, unknown>,
    agentId: string,
    now = Date.now()
): string {
    const parts: string[] = [];
    if (typeof entry.ts === 'number') {
        const d = new Date(entry.ts);
        const abs = d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const rel = formatTsRelative(entry.ts, now);
        parts.push(abs, rel ? `(${rel})` : '');
    }
    parts.push(formatAgentIdShort(agentId));
    parts.push(String(entry.action ?? ''));
    parts.push(String(entry.secretName ?? ''));
    return parts.filter(Boolean).join(' ');
}

export function formatActivityDetail(
    entry: Record<string, unknown>,
    agentId: string,
    now = Date.now()
): string[] {
    const formatted: Record<string, unknown> = { ...entry, agentId };
    if (typeof formatted.ts === 'number') {
        const d = new Date(formatted.ts);
        const abs = d.toLocaleString();
        const rel = formatTsRelative(formatted.ts, now);
        formatted.ts = rel ? `${abs} (${rel})` : abs;
    }
    return Object.entries(formatted).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`);
}
