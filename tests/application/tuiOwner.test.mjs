import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addSecretIfMissing,
  getActivitySummary,
  getSecretValue,
  listRegisteredAgents,
  listRegisteredCapabilities,
  listSecretAliases,
  summarizeOwnerContext,
} from '../../dist/application/tuiOwner.js';

function createFakeContext() {
  const secretStore = new Map([['taken', 'existing']]);
  const auditEntries = [
    {
      entryId: 'a1',
      occurredAt: '2026-03-21T10:00:00.000Z',
      vaultId: 'vault_123',
      actor: { kind: 'owner', id: 'owner_test123' },
      action: 'write_secret',
      outcome: 'succeeded',
      detail: 'secret stored',
      secretAlias: 'taken',
      secretId: 'secret_1',
    },
    {
      entryId: 'a2',
      occurredAt: '2026-03-21T10:01:00.000Z',
      vaultId: 'vault_123',
      actor: { kind: 'owner', id: 'owner_test123' },
      action: 'register_agent_identity',
      outcome: 'succeeded',
      detail: 'agent identity registered: agent_child',
    },
    {
      entryId: 'a3',
      occurredAt: '2026-03-21T10:02:00.000Z',
      vaultId: 'vault_123',
      actor: { kind: 'owner', id: 'owner_test123' },
      action: 'register_capability',
      outcome: 'succeeded',
      detail: 'capability registered: cap_post',
      capabilityId: 'cap_post',
      operation: 'dispatch_http',
    },
  ];

  return {
    ownerId: 'owner_test123',
    agentId: 'agent_root',
    publicKey: 'pub_test',
    vaultId: 'vault_123',
    vaultDir: '/tmp/vault_123',
    owner: {
      async exportSecret({ alias }) {
        if (!secretStore.has(alias)) {
          throw new Error('not found');
        }
        return { plaintext: secretStore.get(alias) };
      },
      async writeSecret({ alias, plaintext, targetBindings }) {
        secretStore.set(alias, plaintext);
        auditEntries.push({
          entryId: `a${auditEntries.length + 1}`,
          occurredAt: '2026-03-21T10:03:00.000Z',
          vaultId: 'vault_123',
          actor: { kind: 'owner', id: 'owner_test123' },
          action: 'write_secret',
          outcome: 'succeeded',
          detail: 'secret stored',
          secretAlias: alias,
          secretId: `secret_${auditEntries.length + 1}`,
          targetBindings,
        });
      },
      async readAudit() {
        return auditEntries;
      },
      async registerAgent() {},
      async grantCapability() {},
    },
  };
}

test('owner summaries reflect secrets, agents, capabilities, and audit', async () => {
  const context = createFakeContext();
  const summary = await summarizeOwnerContext(context);

  assert.equal(summary.secretCount, 1);
  assert.equal(summary.agentCount, 1);
  assert.equal(summary.capabilityCount, 1);
  assert.equal(summary.auditCount, 3);
});

test('owner listings derive from audit records', async () => {
  const context = createFakeContext();

  assert.deepEqual(await listSecretAliases(context), ['taken']);
  assert.deepEqual(await listRegisteredAgents(context), [{
    agentId: 'agent_child',
    detail: 'agent identity registered: agent_child',
    occurredAt: '2026-03-21T10:01:00.000Z',
  }]);
  assert.deepEqual(await listRegisteredCapabilities(context), [{
    capabilityId: 'cap_post',
    operation: 'dispatch_http',
    detail: 'capability registered: cap_post',
    occurredAt: '2026-03-21T10:02:00.000Z',
  }]);
});

test('owner vault actions still add and export secrets', async () => {
  const context = createFakeContext();

  assert.deepEqual(
    await addSecretIfMissing(context, 'fresh', 'value', 'https://example.com/ai/post', 'post'),
    { ok: true },
  );
  assert.equal(await getSecretValue(context, 'fresh'), 'value');
});

test('owner activity summary returns most recent entries first', async () => {
  const context = createFakeContext();
  const summary = await getActivitySummary(context);

  assert.equal(summary.actorId, 'owner_test123');
  assert.equal(summary.recentEntries[0].action, 'register_capability');
});
