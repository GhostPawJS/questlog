import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { captureRumorTool } from './capture_rumor_tool.ts';
import { searchQuestlogTool } from './search_questlog_tool.ts';
import {
	createToolTestDb,
	expectClarification,
	expectError,
	expectSuccess,
} from './tool_test_utils.ts';

describe('searchQuestlogTool', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createToolTestDb();
	});

	it('rejects blank queries as invalid input', () => {
		const result = expectError(
			searchQuestlogTool.handler(db, {
				query: '   ',
			}),
		);

		strictEqual(result.error.kind, 'protocol');
		strictEqual(result.error.code, 'invalid_input');
	});

	it('asks for clarification when identify-one mode finds multiple matches', () => {
		captureRumorTool.handler(db, { title: 'Alpha launch', now: 1 });
		captureRumorTool.handler(db, { title: 'Alpha audit', now: 2 });

		const result = expectClarification(
			searchQuestlogTool.handler(db, {
				query: 'Alpha',
				mode: 'identify_one',
			}),
		);

		strictEqual(result.clarification.code, 'ambiguous_target');
		deepStrictEqual(result.clarification.missing, ['query']);
		strictEqual(result.clarification.options?.length, 2);
	});

	it('returns empty-result warnings instead of failing when nothing matches', () => {
		const result = expectSuccess(
			searchQuestlogTool.handler(db, {
				query: 'no such thing',
			}),
		);

		strictEqual(result.data.totalCount, 0);
		strictEqual(result.data.returnedCount, 0);
		strictEqual(result.warnings?.[0]?.code, 'empty_result');
	});
});
