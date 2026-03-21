import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as read from './read.ts';

describe('read barrel', () => {
	it('re-exports query surface without wiring to write mutations', () => {
		strictEqual(typeof read.getQuestDetail, 'function');
		strictEqual(typeof read.listOpenQuests, 'function');
		strictEqual(typeof read.searchQuestlog, 'function');
		strictEqual(typeof read.getRumorDetail, 'function');
	});
});
