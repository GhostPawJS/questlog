import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { runQuestTool } from './run_quest_tool.ts';
import { shapeWorkTool } from './shape_work_tool.ts';
import { createToolTestDb, expectError, expectSuccess } from './tool_test_utils.ts';

describe('runQuestTool', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createToolTestDb();
	});

	it('returns invalid-state when trying to start a resolved quest', () => {
		const created = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Already done',
					objective: 'Resolve before trying to restart.',
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
		expectSuccess(
			runQuestTool.handler(db, {
				action: 'finish',
				questId: created.data.quest.id,
				outcome: 'Completed.',
			}),
		);

		const result = expectError(
			runQuestTool.handler(db, {
				action: 'start',
				questId: created.data.quest.id,
			}),
		);

		strictEqual(result.error.kind, 'domain');
		strictEqual(result.error.code, 'invalid_state');
	});

	it('rejects abandon-and-spawn-followups calls with no follow-up quests', () => {
		const created = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Need follow-up detail',
					objective: 'Exercise protocol validation.',
				},
			}),
		);
		if (!created.data.quest) {
			throw new Error('expected created quest');
		}

		const result = expectError(
			runQuestTool.handler(db, {
				action: 'abandon_and_spawn_followups',
				questId: created.data.quest.id,
				outcome: 'Blocked.',
				followups: [],
			}),
		);

		strictEqual(result.error.kind, 'protocol');
		strictEqual(result.error.code, 'invalid_input');
	});
});
