import { ok, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { inspectQuestlogItemTool } from './inspect_questlog_item_tool.ts';
import { shapeWorkTool } from './shape_work_tool.ts';
import { createToolTestDb, expectError, expectSuccess } from './tool_test_utils.ts';

describe('inspectQuestlogItemTool', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createToolTestDb();
	});

	it('defaults to compact detail and expands when full detail is requested', () => {
		const created = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Inspect me',
					objective: 'Exercise compact and full tool detail.',
					tags: ['ops'],
				},
			}),
		);
		if (!created.data.quest) {
			throw new Error('expected quest detail');
		}

		const compact = expectSuccess(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'quest', id: created.data.quest.id },
			}),
		);
		const full = expectSuccess(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'quest', id: created.data.quest.id },
				detailLevel: 'full',
			}),
		);

		strictEqual(compact.data.detailLevel, 'compact');
		strictEqual(full.data.detailLevel, 'full');
		ok(!('rewards' in compact.data.item.detail));
		ok('rewards' in full.data.item.detail);
	});

	it('returns a not-found error when the target id is wrong', () => {
		const result = expectError(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'quest', id: 999_999 },
			}),
		);

		strictEqual(result.error.kind, 'domain');
		strictEqual(result.error.code, 'not_found');
	});
});
