import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { planQuestTool } from './plan_quest_tool.ts';
import { runQuestTool } from './run_quest_tool.ts';
import { shapeWorkTool } from './shape_work_tool.ts';
import { createToolTestDb, expectError, expectNoOp, expectSuccess } from './tool_test_utils.ts';

describe('planQuestTool', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createToolTestDb();
	});

	it('returns a no-op when the requested planning state already matches', () => {
		const created = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Already planned',
					objective: 'Keep the same planning fields.',
					dueAt: 1_000,
				},
			}),
		);
		if (!created.data.quest) {
			throw new Error('expected created quest');
		}

		const result = expectNoOp(
			planQuestTool.handler(db, {
				action: 'set_time',
				questId: created.data.quest.id,
				dueAt: 1_000,
			}),
		);

		strictEqual(result.data.quest.dueAt, 1_000);
	});

	it('returns invalid-state when revising the objective after start', () => {
		const created = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Too late to revise',
					objective: 'Original objective.',
				},
			}),
		);
		if (!created.data.quest) {
			throw new Error('expected created quest');
		}

		expectSuccess(
			runQuestTool.handler(db, {
				action: 'start',
				questId: created.data.quest.id,
			}),
		);

		const result = expectError(
			planQuestTool.handler(db, {
				action: 'revise_objective',
				questId: created.data.quest.id,
				objective: 'Rewritten objective.',
			}),
		);

		strictEqual(result.error.kind, 'domain');
		strictEqual(result.error.code, 'invalid_state');
	});
});
