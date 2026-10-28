import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseHookHeaders } from './hook_headers.ts';

test('custom headers normalize names, preserve values, and reject unsafe inputs without revealing values', () => {
	const headers = parseHookHeaders([
		'Authorization: Bearer private',
		'X-Key: a:b',
		'__proto__: allowed',
	]);
	assert.equal(headers.authorization, 'Bearer private');
	assert.equal(headers['x-key'], 'a:b');
	assert.equal(headers.__proto__, 'allowed');
	for (const line of [
		'Bad Name: private',
		'Missing private',
		': private',
		'Host: private',
		'CONTENT-LENGTH: private',
		'Content-Type: private',
		'X-Questlog-Signature: private',
		'X-Key: private\r\ninjected',
		'X-Key: private\0',
	]) {
		assert.throws(
			() => parseHookHeaders([line]),
			(error) => {
				assert.ok(error instanceof Error);
				assert.doesNotMatch(error.message, /private|injected/);
				return true;
			},
		);
	}
});
