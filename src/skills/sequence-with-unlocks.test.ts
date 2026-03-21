import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { organizeWorkTool, reviewQuestlogTool, shapeWorkTool } from '../tools/index.ts';
import { sequenceWithUnlocksSkill } from './sequence-with-unlocks.ts';
import {
	createSkillTestDb,
	expectError,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('sequenceWithUnlocksSkill', () => {
	it('models hard sequence with unlocks and rejects invalid self-unlock structure', async () => {
		expectSkillMentionsTools(sequenceWithUnlocksSkill, [
			'organize_work',
			'review_questlog',
			'inspect_questlog_item',
			'shape_work',
		]);
		expectSkillAvoidsDirectApi(sequenceWithUnlocksSkill, [
			'addUnlock',
			'removeUnlock',
			'replaceUnlocks',
		]);

		const db = await createSkillTestDb();
		const questA = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: { title: 'Draft proposal', objective: 'Draft the proposal.' },
			}),
		);
		const questB = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: { title: 'Approve proposal', objective: 'Approve the proposal.' },
			}),
		);

		expectSuccess(
			organizeWorkTool.handler(db, {
				action: 'add_unlock',
				fromQuestId: questA.data.quest?.id ?? 0,
				toQuestId: questB.data.quest?.id ?? 0,
			}),
		);

		const blocked = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.blocked',
			}),
		);
		strictEqual(blocked.data.count, 1);

		const invalidSelfUnlock = expectError(
			organizeWorkTool.handler(db, {
				action: 'add_unlock',
				fromQuestId: questA.data.quest?.id ?? 0,
				toQuestId: questA.data.quest?.id ?? 0,
			}),
		);
		strictEqual(invalidSelfUnlock.error.code, 'constraint_violation');
	});
});
