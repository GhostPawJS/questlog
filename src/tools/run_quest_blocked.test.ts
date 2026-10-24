import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createQuest, finishQuest, getQuestDetail, startQuest } from '../quests/index.ts';
import { softDeleteQuest } from '../quests/soft_delete_quest.ts';
import { addUnlock } from '../unlocks/index.ts';
import { runQuestToolHandler } from './run_quest_tool.ts';
import { createToolTestDb } from './tool_test_utils.ts';

test('blocked starts name blockers, preserve state, and can be forced', async () => {
	const db = await createToolTestDb();
	try {
		const blocker = createQuest(db, { title: 'Review prerequisite', objective: 'Review' });
		const quest = createQuest(db, { title: 'Deploy', objective: 'Deploy' });
		addUnlock(db, blocker.id, quest.id);
		const result = runQuestToolHandler(db, { action: 'start', questId: quest.id });
		assert.equal(result.outcome, 'error');
		if (result.outcome !== 'error') throw new Error('expected error');
		assert.equal(result.error.code, 'invalid_state');
		assert.match(result.summary, /Review prerequisite/);
		assert.equal(
			result.next?.[0]?.suggestedInput?.target &&
				JSON.stringify(result.next[0].suggestedInput.target),
			JSON.stringify({ kind: 'quest', id: blocker.id }),
		);
		assert.match(result.next?.[0]?.message ?? '', /finish blocker/);
		assert.equal(getQuestDetail(db, quest.id).startedAt, null);
		const forced = runQuestToolHandler(db, { action: 'start', questId: quest.id, force: true });
		assert.equal(forced.outcome, 'success');
		assert.match(forced.warnings?.[0]?.message ?? '', /Review prerequisite/);
		assert.ok(getQuestDetail(db, quest.id).startedAt);
	} finally {
		db.close();
	}
});
test('unblocked tool starts and permissive library starts remain supported', async () => {
	const db = await createToolTestDb();
	try {
		const blocker = createQuest(db, { title: 'Prerequisite', objective: 'Review' });
		const library = createQuest(db, { title: 'Library start', objective: 'Review' });
		const tool = createQuest(db, { title: 'Tool start', objective: 'Review' });
		addUnlock(db, blocker.id, library.id);
		addUnlock(db, blocker.id, tool.id);
		startQuest(db, library.id);
		assert.ok(getQuestDetail(db, library.id).startedAt);
		finishQuest(db, blocker.id, 'Reviewed');
		const result = runQuestToolHandler(db, { action: 'start', questId: tool.id });
		assert.equal(result.outcome, 'success');
		assert.equal(result.warnings, undefined);
		assert.ok(getQuestDetail(db, tool.id).startedAt);
	} finally {
		db.close();
	}
});

test('deleted prerequisites do not block tool starts', async () => {
	const db = await createToolTestDb();
	try {
		const blocker = createQuest(db, { title: 'Removed prerequisite', objective: 'Review' });
		const quest = createQuest(db, { title: 'Start work', objective: 'Review' });
		addUnlock(db, blocker.id, quest.id);
		softDeleteQuest(db, blocker.id);
		assert.equal(
			runQuestToolHandler(db, { action: 'start', questId: quest.id }).outcome,
			'success',
		);
		assert.ok(getQuestDetail(db, quest.id).startedAt);
	} finally {
		db.close();
	}
});
