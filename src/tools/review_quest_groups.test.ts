import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from '../quests/create_quest.ts';
import { getQuestDetail } from '../quests/get_quest_detail.ts';
import { planQuestTool } from './plan_quest_tool.ts';
import { duplicateGroups } from './review_quest_groups.ts';
import { reviewQuestlogTool } from './review_questlog_tool.ts';
import { expectSuccess } from './tool_test_utils.ts';

test('facade retitles quests and counts filtered duplicate groups', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		const quest = createQuest(db, { title: 'Original', objective: 'Neutral', tags: ['work'] });
		const revised = expectSuccess(
			planQuestTool.handler(db, {
				action: 'revise_title',
				questId: quest.id,
				title: '  Docs: Check release notes today  ',
			}),
		);
		assert.equal(revised.data.quest.title, 'Docs: Check release notes today');
		assert.equal(
			planQuestTool.handler(db, { action: 'revise_title', questId: quest.id, title: ' ' }).ok,
			false,
		);
		createQuest(db, {
			title: 'docs CHECK release notes today!',
			objective: 'Neutral',
			tags: ['work'],
		});
		createQuest(db, { title: 'Other', objective: 'Neutral' });
		const review = (countBy?: 'tag' | 'prefix') =>
			expectSuccess(
				reviewQuestlogTool.handler(db, {
					view: 'quests.duplicates',
					filters: { tagNames: ['work'] },
					...(countBy ? { countBy } : {}),
				}),
			).data;
		assert.equal(review().groups?.length, 1);
		assert.equal(review().groups?.[0]?.ids.length, 2);
		assert.deepEqual(review('tag').counts, [{ key: 'work', count: 2 }]);
		assert.deepEqual(review('prefix').counts, [
			{ key: '(none)', count: 1 },
			{ key: 'Docs', count: 1 },
		]);
		assert.equal(review('tag').items.length, 0);
		assert.equal(reviewQuestlogTool.handler(db, { view: 'rumors', countBy: 'tag' }).ok, false);
	} finally {
		db.close();
	}
});

test('duplicate similarity uses the Jaccard threshold and joins overlapping groups', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		const titles = [
			'one two three four five six seven eight nine ten',
			'one two three four five six seven eight nine ten eleven',
			'one two three four five six seven eight nine ten twelve',
			'one two unrelated',
		];
		const quests = titles.map((title) =>
			getQuestDetail(db, createQuest(db, { title, objective: 'Neutral' }).id),
		);
		const groups = duplicateGroups(quests);
		assert.deepEqual(
			groups.map((g) => g.ids),
			[quests.slice(0, 3).map((q) => q.id)],
		);
	} finally {
		db.close();
	}
});
