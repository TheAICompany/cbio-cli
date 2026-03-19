import test from 'node:test';
import assert from 'node:assert/strict';

import { addSecretIfMissing, deleteSecretWithResult, getActivitySummary, getSecretValue } from '../../dist/application/tuiVault.js';
import { createIdentityMaterial } from '../../dist/application/identity.js';

function createFakeIdentity({ publicKey, names = [], secretValues = {}, deleteError } = {}) {
  const secretStore = new Map(Object.entries(secretValues));
  const activityLog = [
    { ts: Date.now() - 15_000, action: 'get', secretName: 'alpha' },
    { ts: Date.now() - 5_000, action: 'delete', secretName: 'beta' },
  ];

  return {
    hasSecret(name) {
      return names.includes(name) || secretStore.has(name);
    },
    async getPublicKey() {
      return publicKey;
    },
    admin: {
      vault: {
        getSecret(name) {
          return secretStore.get(name);
        },
        async addSecret(name, value) {
          secretStore.set(name, value);
        },
        async deleteSecret(name) {
          if (deleteError) throw deleteError;
          secretStore.delete(name);
        },
        async getActivityLog() {
          return activityLog;
        },
      },
    },
  };
}

test('addSecretIfMissing adds new secrets and blocks duplicates', async () => {
  const identity = createFakeIdentity({ publicKey: createIdentityMaterial().publicKey, names: ['taken'] });

  assert.deepEqual(await addSecretIfMissing(identity, 'fresh', 'value'), { ok: true });
  assert.equal(getSecretValue(identity, 'fresh'), 'value');

  assert.deepEqual(await addSecretIfMissing(identity, 'taken', 'ignored'), {
    ok: false,
    message: 'Secret "taken" already exists.',
  });
});

test('deleteSecretWithResult returns structured success and failure results', async () => {
  const okIdentity = createFakeIdentity({
    publicKey: createIdentityMaterial().publicKey,
    secretValues: { alpha: 'one' },
  });
  assert.deepEqual(await deleteSecretWithResult(okIdentity, 'alpha'), { ok: true });
  assert.equal(getSecretValue(okIdentity, 'alpha'), undefined);

  const failingIdentity = createFakeIdentity({
    publicKey: createIdentityMaterial().publicKey,
    deleteError: new Error('boom'),
  });
  assert.deepEqual(await deleteSecretWithResult(failingIdentity, 'alpha'), { ok: false, error: 'boom' });
});

test('getActivitySummary returns recent entries and the derived root agent id', async () => {
  const material = createIdentityMaterial();
  const identity = createFakeIdentity({ publicKey: material.publicKey });

  const summary = await getActivitySummary(identity);

  assert.equal(summary.recentEntries.length, 2);
  assert.equal(summary.agentId, material.agentId);
});
