import test from 'node:test';
import assert from 'node:assert';
import { sign, verify, safeEqual, hmacB64, sameOrigin } from '../functions/_lib/util.js';
const S = 'x'.repeat(32);
test('session round trip', async () => { const t = await sign({ sub: '1' }, S); assert.equal((await verify(t, S)).sub, '1'); });
test('tampered session rejected', async () => { const t = await sign({ sub: '1' }, S); assert.equal(await verify(t.slice(0, -2) + 'AA', S), null); });
test('wrong secret rejected', async () => { assert.equal(await verify(await sign({ sub: '1' }, S), 'y'.repeat(32)), null); });
test('expired session rejected', async () => { assert.equal(await verify(await sign({ sub: '1' }, S, -10), S), null); });
test('missing token rejected', async () => { assert.equal(await verify(undefined, S), null); });
test('webhook signature check', async () => {
  const good = await hmacB64('secret', '1700000000{"a":1}');
  assert.ok(safeEqual(good, await hmacB64('secret', '1700000000{"a":1}')));
  assert.ok(!safeEqual(good, await hmacB64('secret', '1700000001{"a":1}')));
});
test('csrf origin check', () => {
  const r = o => new Request('https://a.com/x', { method: 'POST', headers: o ? { origin: o } : {} });
  assert.ok(sameOrigin(r('https://a.com'))); assert.ok(!sameOrigin(r('https://evil.com'))); assert.ok(!sameOrigin(r()));
});
