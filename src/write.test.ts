import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as write from './write';

describe('write barrel', () => {
	it('re-exports mutation surface', () => {
		strictEqual(typeof write.createQuest, 'function');
		strictEqual(typeof write.finishQuest, 'function');
		strictEqual(typeof write.captureRumor, 'function');
		strictEqual(typeof write.replaceQuestTags, 'function');
	});
});
