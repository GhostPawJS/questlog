import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { organizeWorkTool, reviewQuestlogTool, shapeWorkTool } from '../tools/index.ts';
import { escalateAndUnblockSkill } from './escalate-and-unblock.ts';
import {
	createSkillTestDb,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('escalateAndUnblockSkill', () => {
	it('diagnoses blocked work and unblocks it by correcting the unlock graph', async () => {
		expectSkillMentionsTools(escalateAndUnblockSkill, [
			'review_questlog',
			'inspect_questlog_item',
			'organize_work',
			'plan_quest',
		]);
		expectSkillAvoidsDirectApi(escalateAndUnblockSkill, [
			'listBlockedQuests',
			'removeUnlock',
			'getQuestDetail',
		]);

		const db = await createSkillTestDb();
		const gate = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: { title: 'Get approval', objective: 'Get approval first.' },
			}),
		);
		const work = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: { title: 'Ship update', objective: 'Ship the update.' },
			}),
		);

		expectSuccess(
			organizeWorkTool.handler(db, {
				action: 'add_unlock',
				fromQuestId: gate.data.quest?.id ?? 0,
				toQuestId: work.data.quest?.id ?? 0,
			}),
		);

		const blocked = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.blocked',
			}),
		);
		strictEqual(blocked.data.count, 1);

		expectSuccess(
			organizeWorkTool.handler(db, {
				action: 'remove_unlock',
				fromQuestId: gate.data.quest?.id ?? 0,
				toQuestId: work.data.quest?.id ?? 0,
			}),
		);

		const available = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.available',
			}),
		);
		strictEqual(available.data.count, 2);
	});
});
