import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { rewardWorkTool, runQuestTool, shapeWorkTool } from '../tools/index.ts';
import { closeWorkAndClaimOutcomesSkill } from './close-work-and-claim-outcomes.ts';
import {
	createSkillTestDb,
	expectNoOp,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('closeWorkAndClaimOutcomesSkill', () => {
	it('finishes work, claims rewards separately, and treats repeated claim as no-op', async () => {
		expectSkillMentionsTools(closeWorkAndClaimOutcomesSkill, [
			'run_quest',
			'reward_work',
			'review_questlog',
			'inspect_questlog_item',
		]);
		expectSkillAvoidsDirectApi(closeWorkAndClaimOutcomesSkill, [
			'finishQuest',
			'claimQuestReward',
			'getQuestDetail',
		]);

		const db = await createSkillTestDb();
		const quest = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Ship note',
					objective: 'Ship the final note.',
				},
			}),
		);
		const questId = quest.data.quest?.id ?? 0;

		const reward = expectSuccess(
			rewardWorkTool.handler(db, {
				action: 'add',
				target: { kind: 'quest', id: questId },
				reward: {
					kind: 'xp',
					name: 'Ship XP',
				},
			}),
		);

		expectSuccess(
			runQuestTool.handler(db, {
				action: 'start',
				questId,
			}),
		);

		expectSuccess(
			runQuestTool.handler(db, {
				action: 'finish',
				questId,
				outcome: 'The note shipped successfully.',
			}),
		);

		const claimed = expectSuccess(
			rewardWorkTool.handler(db, {
				action: 'claim',
				target: { kind: 'reward', id: reward.data.reward?.id ?? 0 },
			}),
		);
		strictEqual(claimed.data.reward?.claimedAt != null, true);

		const claimedAgain = expectNoOp(
			rewardWorkTool.handler(db, {
				action: 'claim',
				target: { kind: 'reward', id: reward.data.reward?.id ?? 0 },
			}),
		);
		strictEqual(claimedAgain.data.action, 'claim');
	});
});
