import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectQuestlogItemTool, shapeWorkTool } from '../tools/index.ts';
import { recoverFromModelingMistakesSkill } from './recover-from-modeling-mistakes.ts';
import {
	createSkillTestDb,
	expectNoOp,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('recoverFromModelingMistakesSkill', () => {
	it('diagnoses the current structure before applying a small corrective move', async () => {
		expectSkillMentionsTools(recoverFromModelingMistakesSkill, [
			'inspect_questlog_item',
			'review_questlog',
			'shape_work',
			'organize_work',
			'plan_quest',
			'retire_work',
		]);
		expectSkillAvoidsDirectApi(recoverFromModelingMistakesSkill, [
			'getQuestDetail',
			'moveQuestToQuestline',
			'softDeleteQuest',
		]);

		const db = await createSkillTestDb();
		const quest = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Misfiled task',
					objective: 'A task that should stay standalone.',
				},
			}),
		);

		const diagnosis = expectSuccess(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'quest', id: quest.data.quest?.id ?? 0 },
			}),
		);
		strictEqual(diagnosis.data.item.kind, 'quest');

		const detachNoOp = expectNoOp(
			shapeWorkTool.handler(db, {
				action: 'detach_quest_from_questline',
				questId: quest.data.quest?.id ?? 0,
			}),
		);
		strictEqual(detachNoOp.data.action, 'detach_quest_from_questline');
	});
});
