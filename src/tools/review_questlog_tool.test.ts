import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
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
