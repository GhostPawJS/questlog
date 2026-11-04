import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createQuest } from '../quests/create_quest.ts';
import { reviewQuestlogTool } from './review_questlog_tool.ts';
import {
	createToolTestDb,
	expectClarification,
	expectError,
	expectSuccess,
} from './tool_test_utils.ts';

describe('reviewQuestlogTool', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createToolTestDb();
	});

	it('filters quest views by all filters.tagNames', () => {
		const first = createQuest(db, { title: 'Work', objective: 'Work', tags: ['work'] });
		const both = createQuest(db, { title: 'Both', objective: 'Both', tags: ['work', 'urgent'] });
		const review = (tags: string[]) =>
			expectSuccess(
				reviewQuestlogTool.handler(db, { view: 'quests.open', filters: { tagNames: tags } }),
			)
				.data.items.map((item) => item.id)
				.sort();
		deepStrictEqual(review([' WORK ']), [first.id, both.id].sort());
		deepStrictEqual(review(['work', 'urgent']), [both.id]);
		deepStrictEqual(review(['unknown']), []);
		expectError(
			reviewQuestlogTool.handler(db, { view: 'rumors', filters: { tagNames: ['work'] } }),
		);
	});

	it('asks for the day when scheduled-for-day is underspecified', () => {
		const result = expectClarification(
			reviewQuestlogTool.handler(db, {
				view: 'quests.scheduled_for_day',
			}),
		);

		strictEqual(result.clarification.code, 'missing_required_choice');
		deepStrictEqual(result.clarification.missing, ['filters.dayAt']);
	});

	it('rejects dayAt when the chosen view does not support it', () => {
		const result = expectError(
			reviewQuestlogTool.handler(db, {
				view: 'quests.available',
				filters: { dayAt: 123 },
			}),
		);

		strictEqual(result.error.kind, 'protocol');
		strictEqual(result.error.code, 'invalid_input');
	});

	it('returns a structured empty view instead of failing', () => {
		const result = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'rumors',
				now: 50,
			}),
		);

		strictEqual(result.data.count, 0);
		strictEqual(result.data.evaluatedAt, 50);
		strictEqual(result.warnings?.[0]?.code, 'empty_result');
	});
});
