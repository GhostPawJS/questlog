import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as repeatable from './index';

describe('repeatable_quests barrel', () => {
	it('exports definitions and spawn helpers', () => {
		strictEqual(typeof repeatable.createRepeatableQuest, 'function');
		strictEqual(typeof repeatable.updateRepeatableQuest, 'function');
		strictEqual(typeof repeatable.spawnDueRepeatableQuests, 'function');
	});
});
