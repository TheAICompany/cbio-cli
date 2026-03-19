import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveProxyPort, validateUpstreamUrl } from '../../dist/application/proxy.js';

test('validateUpstreamUrl accepts http and https URLs', () => {
  assert.equal(validateUpstreamUrl('https://example.com/api'), 'https://example.com/api');
  assert.equal(validateUpstreamUrl('http://localhost:3000'), 'http://localhost:3000');
});

test('validateUpstreamUrl rejects unsupported protocols', () => {
  assert.throws(() => validateUpstreamUrl('ftp://example.com'), /Invalid upstream URL/);
  assert.throws(() => validateUpstreamUrl('not-a-url'), /Invalid upstream URL/);
});

test('resolveProxyPort reads numeric env values and defaults to zero', () => {
  const previous = process.env.C_BIO_PROXY_PORT;

  try {
    delete process.env.C_BIO_PROXY_PORT;
    assert.equal(resolveProxyPort(), 0);

    process.env.C_BIO_PROXY_PORT = '4123';
    assert.equal(resolveProxyPort(), 4123);
  } finally {
    if (previous === undefined) delete process.env.C_BIO_PROXY_PORT;
    else process.env.C_BIO_PROXY_PORT = previous;
  }
});

test('resolveProxyPort rejects invalid env values', () => {
  const previous = process.env.C_BIO_PROXY_PORT;

  try {
    process.env.C_BIO_PROXY_PORT = 'abc';
    assert.throws(() => resolveProxyPort(), /must be a valid number/);
  } finally {
    if (previous === undefined) delete process.env.C_BIO_PROXY_PORT;
    else process.env.C_BIO_PROXY_PORT = previous;
  }
});
