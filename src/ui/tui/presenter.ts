function formatTsRelative(ts: number, now = Date.now()): string | null {
    const d = now - ts;
    if (d < 60_000) return `${Math.floor(d / 1000)}s ago`;
    if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
    if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
    if (d < 86_400_000 * 7) return `${Math.floor(d / 86_400_000)}d ago`;
    return null;
}

function formatIdShort(value: string): string {
    const i = value.indexOf('_');
    if (i < 0) return value.length > 12 ? value.slice(0, 6) + '...' + value.slice(-3) : value;
    const prefix = value.slice(0, i + 1);
    const id = value.slice(i + 1);
    if (id.length <= 9) return value;
    return prefix + id.slice(0, 3) + '...' + id.slice(-3);
}

function readEntryTs(entry: Record<string, unknown>): number | null {
    if (typeof entry.ts === 'number') return entry.ts;
    if (typeof entry.occurredAt === 'string') {
        const parsed = Date.parse(entry.occurredAt);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
}

export function formatActivityListEntry(
    entry: Record<string, unknown>,
    actorId: string,
    now = Date.now()
): string {
    const parts: string[] = [];
    const ts = readEntryTs(entry);
    if (typeof ts === 'number') {
        const d = new Date(ts);
        const abs = d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const rel = formatTsRelative(ts, now);
        parts.push(abs, rel ? `(${rel})` : '');
    }
    const actor = typeof entry.actor === 'object' && entry.actor !== null
        ? (entry.actor as Record<string, unknown>)
        : null;
    const actorLabel = typeof actor?.id === 'string' ? actor.id : actorId;
    parts.push(formatIdShort(actorLabel));
    parts.push(String(entry.action ?? ''));
    parts.push(String(entry.secretAlias ?? entry.secretName ?? entry.capabilityId ?? ''));
    return parts.filter(Boolean).join(' ');
}

export function formatActivityDetail(
    entry: Record<string, unknown>,
    actorId: string,
    now = Date.now()
): string[] {
    const actor = typeof entry.actor === 'object' && entry.actor !== null
        ? (entry.actor as Record<string, unknown>)
        : null;
    const formatted: Record<string, unknown> = {
        ...entry,
        actorId: typeof actor?.id === 'string' ? actor.id : actorId,
    };
    const ts = readEntryTs(formatted);
    if (typeof ts === 'number') {
        const d = new Date(ts);
        const abs = d.toLocaleString();
        const rel = formatTsRelative(ts, now);
        formatted.occurredAt = rel ? `${abs} (${rel})` : abs;
        delete formatted.ts;
    }
    return Object.entries(formatted).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`);
}
