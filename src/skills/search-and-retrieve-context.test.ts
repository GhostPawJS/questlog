import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	inspectQuestlogItemTool,
	reviewQuestlogTool,
	searchQuestlogTool,
	shapeWorkTool,
} from '../tools/index.ts';
import { searchAndRetrieveContextSkill } from './search-and-retrieve-context.ts';
import {
	createSkillTestDb,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('searchAndRetrieveContextSkill', () => {
	it('uses search for text discovery, inspect for exact detail, and review for non-FTS structure', async () => {
		expectSkillMentionsTools(searchAndRetrieveContextSkill, [
			'search_questlog',
			'review_questlog',
			'inspect_questlog_item',
		]);
		expectSkillAvoidsDirectApi(searchAndRetrieveContextSkill, [
			'searchQuestlog',
			'getQuestDetail',
			'listQuestlines',
		]);

		const db = await createSkillTestDb();
		const quest = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Review launch brief',
					objective: 'Read and annotate the launch brief.',
				},
			}),
		);
		const questline = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_questline',
				questline: {
					title: 'Launch Initiative',
					description: 'Shared context for launch work.',
				},
			}),
		);

		const searched = expectSuccess(
			searchQuestlogTool.handler(db, {
				query: 'launch brief',
				mode: 'identify_one',
			}),
		);
		strictEqual(searched.data.totalCount, 1);

		const inspected = expectSuccess(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'quest', id: quest.data.quest?.id ?? 0 },
				detailLevel: 'full',
			}),
		);
		strictEqual(inspected.data.item.kind, 'quest');

		const noQuestlineSearchHits = expectSuccess(
			searchQuestlogTool.handler(db, {
				query: 'Launch Initiative',
			}),
		);
		strictEqual(noQuestlineSearchHits.data.totalCount, 0);

		const reviewedQuestlines = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'questlines',
			}),
		);
		strictEqual(reviewedQuestlines.data.count, 1);
		strictEqual(reviewedQuestlines.data.items[0]?.id, questline.data.questline?.id);
	});
});
