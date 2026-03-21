import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { manageRepeatableTool } from './manage_repeatable_tool.ts';
import { createToolTestDb, expectNoOp, expectSuccess } from './tool_test_utils.ts';

describe('manageRepeatableTool', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createToolTestDb();
	});

	it('returns a warning-backed success when no repeatable anchors are due', () => {
		const result = expectSuccess(
			manageRepeatableTool.handler(db, {
				action: 'preview_due',
				now: 0,
			}),
		);

		strictEqual(result.data.items?.length, 0);
		strictEqual(result.warnings?.[0]?.code, 'empty_result');
	});

	it('returns a no-op when spawn_due has nothing to materialize', () => {
		const result = expectNoOp(
			manageRepeatableTool.handler(db, {
				action: 'spawn_due',
				now: 0,
			}),
		);

		strictEqual(result.data.spawnedQuests?.length, 0);
		strictEqual(result.warnings?.[0]?.code, 'empty_result');
	});
});
