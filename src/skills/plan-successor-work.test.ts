import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectQuestlogItemTool, runQuestTool, shapeWorkTool } from '../tools/index.ts';
import { planSuccessorWorkSkill } from './plan-successor-work.ts';
import {
	createSkillTestDb,
	expectError,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('planSuccessorWorkSkill', () => {
	it('spawns explicit follow-up work and rejects empty follow-up abandon flows', async () => {
		expectSkillMentionsTools(planSuccessorWorkSkill, [
			'run_quest',
			'shape_work',
			'capture_rumor',
			'inspect_questlog_item',
		]);
		expectSkillAvoidsDirectApi(planSuccessorWorkSkill, [
			'abandonQuestAndSpawnFollowups',
			'createQuest',
			'captureRumor',
		]);

		const db = await createSkillTestDb();
		const quest = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Old approach',
					objective: 'Test the old approach first.',
				},
			}),
		);
		const questId = quest.data.quest?.id ?? 0;

		const emptyFollowups = expectError(
			runQuestTool.handler(db, {
				action: 'abandon_and_spawn_followups',
				questId,
				outcome: 'Need a better approach.',
				followups: [],
			}),
		);
		strictEqual(emptyFollowups.error.code, 'invalid_input');

		const abandoned = expectSuccess(
			runQuestTool.handler(db, {
				action: 'abandon_and_spawn_followups',
				questId,
				outcome: 'Switching to the better approach.',
				followups: [
					{
						title: 'New approach',
						objective: 'Execute the improved follow-up approach.',
					},
				],
			}),
		);
		strictEqual(abandoned.data.followupQuests?.length, 1);

		const inspected = expectSuccess(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'quest', id: abandoned.data.followupQuests?.[0]?.id ?? 0 },
			}),
		);
		strictEqual(inspected.data.item.kind, 'quest');
	});
});
