import assert from 'node:assert/strict';
import { test } from 'node:test';
import { webhooksSkill } from './webhooks.ts';

test('webhook guide teaches commands, event semantics, and receiver verification', () => {
	for (const text of [
		'questlog hook add',
		'* * * * * questlog tick',
		'timingSafeEqual',
		'quest.unblocked',
		'x-questlog-delivery',
		'CLI-only',
	])
		assert.ok(webhooksSkill.content.includes(text), text);
});
