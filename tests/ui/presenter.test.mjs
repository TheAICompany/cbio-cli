import test from 'node:test';
import assert from 'node:assert/strict';

import { formatActivityDetail, formatActivityListEntry } from '../../dist/ui/tui/presenter.js';

test('formatActivityListEntry includes relative time, shortened agent id, action, and secret name', () => {
  const now = Date.parse('2026-03-19T12:00:00Z');
  const line = formatActivityListEntry(
    { ts: now - 10_000, action: 'get', secretName: 'openai-key' },
    'agent_123456789abcdef',
    now
  );

  assert.match(line, /\(10s ago\)/);
  assert.match(line, /agent_123\.\.\.def/);
  assert.match(line, /get/);
  assert.match(line, /openai-key/);
});

test('formatActivityDetail expands the entry into readable key-value lines', () => {
  const now = Date.parse('2026-03-19T12:00:00Z');
  const lines = formatActivityDetail(
    { ts: now - 120_000, action: 'delete', secretName: 'token' },
    'agent_123456789abcdef',
    now
  );

  assert.ok(lines.some((line) => line.startsWith('  ts: "') && line.includes('2m ago')));
  assert.ok(lines.includes('  action: "delete"'));
  assert.ok(lines.includes('  secretName: "token"'));
  assert.ok(lines.includes('  agentId: "agent_123456789abcdef"'));
});
