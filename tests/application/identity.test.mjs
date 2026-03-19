import test from 'node:test';
import assert from 'node:assert/strict';

import { createIdentityMaterial, deriveAgentIdFromPrivateKey } from '../../dist/application/identity.js';

test('createIdentityMaterial returns a matching derived agent id', () => {
  const identity = createIdentityMaterial();

  assert.equal(typeof identity.privateKey, 'string');
  assert.equal(typeof identity.publicKey, 'string');
  assert.equal(typeof identity.agentId, 'string');
  assert.ok(identity.privateKey.length > 0);
  assert.ok(identity.publicKey.length > 0);
  assert.ok(identity.agentId.length > 0);
  assert.equal(deriveAgentIdFromPrivateKey(identity.privateKey), identity.agentId);
});
