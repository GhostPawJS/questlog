import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { organizeWorkTool } from './organize_work_tool.ts';
import { shapeWorkTool } from './shape_work_tool.ts';
import { createToolTestDb, expectError, expectNoOp, expectSuccess } from './tool_test_utils.ts';

describe('organizeWorkTool', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createToolTestDb();
	});

	it('rejects self-unlocks as a dependency constraint violation', () => {
		const created = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Impossible dependency',
					objective: 'This should not unlock itself.',
				},
			}),
		);
		if (!created.data.quest) {
			throw new Error('expected created quest');
		}

		const result = expectError(
			organizeWorkTool.handler(db, {
				action: 'add_unlock',
				fromQuestId: created.data.quest.id,
				toQuestId: created.data.quest.id,
			}),
		);

		strictEqual(result.error.kind, 'domain');
		strictEqual(result.error.code, 'constraint_violation');
	});

	it('returns a no-op when replacing unlocks with the same blocker set', () => {
		const blocker = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Prerequisite',
					objective: 'Must happen first.',
				},
			}),
		);
		const target = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Blocked quest',
					objective: 'Wait on the prerequisite.',
				},
			}),
		);
		if (!blocker.data.quest || !target.data.quest) {
			throw new Error('expected created quests');
		}

		expectSuccess(
			organizeWorkTool.handler(db, {
				action: 'replace_unlocks',
				fromQuestIds: [blocker.data.quest.id],
				toQuestId: target.data.quest.id,
			}),
		);

		const result = expectNoOp(
			organizeWorkTool.handler(db, {
				action: 'replace_unlocks',
				fromQuestIds: [blocker.data.quest.id, blocker.data.quest.id],
				toQuestId: target.data.quest.id,
			}),
		);

		strictEqual(result.data.quest?.unlockedByQuestIds[0], blocker.data.quest.id);
	});
});
