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
		'Prefer `--header-stdin` for real keys',
		'exposes values in process arguments',
		'missing quests/deliveries also exit 3',
	])
		assert.ok(webhooksSkill.content.includes(text), text);
});
