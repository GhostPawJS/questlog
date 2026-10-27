import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hooks } from '../index.ts';

test('root exports the webhook namespace and event vocabulary', () => {
	assert.equal(typeof hooks.tickQuestlog, 'function');
	assert.equal(typeof hooks.watchQuestlog, 'function');
	assert.equal(hooks.hookEventTypes.length, 5);
});
