import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as rewards from './index';

describe('rewards barrel', () => {
	it('exports reward mutations for quests and repeatables', () => {
		strictEqual(typeof rewards.addQuestReward, 'function');
		strictEqual(typeof rewards.claimQuestReward, 'function');
		strictEqual(typeof rewards.replaceRepeatableQuestRewards, 'function');
	});
});
