import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { retireWorkTool } from './retire_work_tool.ts';
import { shapeWorkTool } from './shape_work_tool.ts';
import { createToolTestDb, expectError, expectNoOp, expectSuccess } from './tool_test_utils.ts';

describe('retireWorkTool', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createToolTestDb();
	});

	it('returns a no-op when the target is already hidden', () => {
		const created = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Retire me',
					objective: 'Exercise soft-delete idempotency.',
				},
			}),
		);
		if (!created.data.quest) {
			throw new Error('expected created quest');
		}

		expectSuccess(
			retireWorkTool.handler(db, {
				action: 'hide',
				target: { kind: 'quest', id: created.data.quest.id },
				deletedAt: 10,
			}),
		);

		const result = expectNoOp(
			retireWorkTool.handler(db, {
				action: 'hide',
				target: { kind: 'quest', id: created.data.quest.id },
				deletedAt: 20,
			}),
		);

		strictEqual(result.data.target.id, created.data.quest.id);
	});

	it('returns not-found when the target does not exist', () => {
		const result = expectError(
			retireWorkTool.handler(db, {
				action: 'hide',
				target: { kind: 'rumor', id: 999_999 },
			}),
		);

		strictEqual(result.error.kind, 'domain');
		strictEqual(result.error.code, 'not_found');
	});
});
