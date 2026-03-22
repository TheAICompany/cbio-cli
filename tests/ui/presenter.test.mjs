import test from 'node:test';
import assert from 'node:assert/strict';

import { formatActivityDetail, formatActivityListEntry } from '../../dist/ui/tui/presenter.js';

test('formatActivityListEntry includes relative time, shortened actor id, action, and alias', () => {
  const now = Date.parse('2026-03-19T12:00:00Z');
  const line = formatActivityListEntry(
    {
      occurredAt: new Date(now - 10_000).toISOString(),
      action: 'write_secret',
      secretAlias: 'openai-key',
      actor: { id: 'owner_123456789abcdef' },
    },
    'owner_fallback',
    now
  );

  assert.match(line, /\(10s ago\)/);
  assert.match(line, /owner_123\.\.\.def/);
  assert.match(line, /write_secret/);
  assert.match(line, /openai-key/);
});

test('formatActivityDetail expands the entry into readable key-value lines', () => {
  const now = Date.parse('2026-03-19T12:00:00Z');
  const lines = formatActivityDetail(
    {
      occurredAt: new Date(now - 120_000).toISOString(),
      action: 'export_secret',
      secretAlias: 'token',
      actor: { id: 'owner_123456789abcdef' },
    },
    'owner_fallback',
    now
  );

  assert.ok(lines.some((line) => line.startsWith('  occurredAt: "') && line.includes('2m ago')));
  assert.ok(lines.includes('  action: "export_secret"'));
  assert.ok(lines.includes('  secretAlias: "token"'));
  assert.ok(lines.includes('  actorId: "owner_123456789abcdef"'));
});
