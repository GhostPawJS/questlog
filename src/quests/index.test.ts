import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as quests from './index';

describe('quests barrel', () => {
	it('exports core quest lifecycle entrypoints', () => {
		strictEqual(typeof quests.createQuest, 'function');
		strictEqual(typeof quests.startQuest, 'function');
		strictEqual(typeof quests.finishQuest, 'function');
		strictEqual(typeof quests.listAvailableQuests, 'function');
	});
});
