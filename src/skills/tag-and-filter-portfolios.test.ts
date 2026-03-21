import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { reviewQuestlogTool, shapeWorkTool, tagWorkTool } from '../tools/index.ts';
import {
	createSkillTestDb,
	expectNoOp,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';
import { tagAndFilterPortfoliosSkill } from './tag-and-filter-portfolios.ts';

describe('tagAndFilterPortfoliosSkill', () => {
	it('classifies work with tags, filters by tags, and accepts repeated classification as no-op', async () => {
		expectSkillMentionsTools(tagAndFilterPortfoliosSkill, [
			'tag_work',
			'review_questlog',
			'inspect_questlog_item',
		]);
		expectSkillAvoidsDirectApi(tagAndFilterPortfoliosSkill, [
			'tagQuest',
			'replaceQuestTags',
			'listAvailableQuests',
		]);

		const db = await createSkillTestDb();
		const quest = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Portfolio cleanup',
					objective: 'Clean up the portfolio tags.',
				},
			}),
		);
		const questId = quest.data.quest?.id ?? 0;

		expectSuccess(
			tagWorkTool.handler(db, {
				action: 'add',
				target: { kind: 'quest', id: questId },
				tagNames: ['portfolio'],
			}),
		);

		const taggedSlice = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.available',
				filters: { tagNames: ['portfolio'] },
			}),
		);
		strictEqual(taggedSlice.data.count, 1);

		const taggedAgain = expectNoOp(
			tagWorkTool.handler(db, {
				action: 'add',
				target: { kind: 'quest', id: questId },
				tagNames: ['portfolio'],
			}),
		);
		strictEqual(taggedAgain.data.action, 'add');
	});
});
