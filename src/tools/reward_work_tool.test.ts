import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { manageRepeatableTool } from './manage_repeatable_tool.ts';
import { rewardWorkTool } from './reward_work_tool.ts';
import { runQuestTool } from './run_quest_tool.ts';
import { shapeWorkTool } from './shape_work_tool.ts';
import { createToolTestDb, expectError, expectNoOp, expectSuccess } from './tool_test_utils.ts';

describe('rewardWorkTool', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createToolTestDb();
	});

	it('returns a no-op when claiming an already claimed reward', () => {
		const created = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Reward claim target',
					objective: 'Claim once, then stay idempotent.',
				},
			}),
		);
		if (!created.data.quest) {
			throw new Error('expected created quest');
		}

		const reward = expectSuccess(
			rewardWorkTool.handler(db, {
				action: 'add',
				target: { kind: 'quest', id: created.data.quest.id },
				reward: {
					kind: 'xp',
					name: 'Claim me',
				},
			}),
		);
		if (!reward.data.reward) {
			throw new Error('expected reward');
		}

		expectSuccess(
			runQuestTool.handler(db, {
				action: 'start',
				questId: created.data.quest.id,
			}),
		);
		expectSuccess(
			runQuestTool.handler(db, {
				action: 'finish',
				questId: created.data.quest.id,
				outcome: 'Done.',
			}),
		);
		expectSuccess(
			rewardWorkTool.handler(db, {
				action: 'claim',
				target: { kind: 'reward', id: reward.data.reward.id },
			}),
		);

		const result = expectNoOp(
			rewardWorkTool.handler(db, {
				action: 'claim',
				target: { kind: 'reward', id: reward.data.reward.id },
			}),
		);

		strictEqual(result.data.reward?.claimedAt != null, true);
	});

	it('returns invalid-state when removing a claimed reward', () => {
		const created = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Claimed reward removal',
					objective: 'Translate the invalid reward state.',
				},
			}),
		);
		if (!created.data.quest) {
			throw new Error('expected created quest');
		}

		const reward = expectSuccess(
			rewardWorkTool.handler(db, {
				action: 'add',
				target: { kind: 'quest', id: created.data.quest.id },
				reward: {
					kind: 'recognition',
					name: 'Keep me',
				},
			}),
		);
		if (!reward.data.reward) {
			throw new Error('expected reward');
		}

		expectSuccess(
			runQuestTool.handler(db, {
				action: 'start',
				questId: created.data.quest.id,
			}),
		);
		expectSuccess(
			runQuestTool.handler(db, {
				action: 'finish',
				questId: created.data.quest.id,
				outcome: 'Done.',
			}),
		);
		expectSuccess(
			rewardWorkTool.handler(db, {
				action: 'claim',
				target: { kind: 'reward', id: reward.data.reward.id },
			}),
		);

		const result = expectError(
			rewardWorkTool.handler(db, {
				action: 'remove',
				target: { kind: 'reward', id: reward.data.reward.id },
			}),
		);

		strictEqual(result.error.kind, 'domain');
		strictEqual(result.error.code, 'invalid_state');
	});

	it('warns that repeatable reward template changes only affect future spawns', () => {
		const repeatable = expectSuccess(
			manageRepeatableTool.handler(db, {
				action: 'create',
				repeatableQuest: {
					title: 'Template rewards',
					objective: 'Check future-only warning shape.',
					rrule: 'FREQ=DAILY',
					anchorAt: 0,
				},
			}),
		);
		if (!repeatable.data.repeatableQuest) {
			throw new Error('expected repeatable quest');
		}

		const result = expectSuccess(
			rewardWorkTool.handler(db, {
				action: 'replace_repeatable_template',
				target: { kind: 'repeatable_quest', id: repeatable.data.repeatableQuest.id },
				rewards: [{ kind: 'xp', name: 'Daily XP' }],
			}),
		);

		strictEqual(result.warnings?.[0]?.code, 'future_only_effect');
	});
});
