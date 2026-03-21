import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from '../quests/create_quest';
import { createQuestline } from './create_questline';
import { detachQuestFromQuestline } from './detach_quest_from_questline';
import { getQuestlineDetail } from './get_questline_detail';
import { moveQuestToQuestline } from './move_quest_to_questline';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('moveQuestToQuestline / detachQuestFromQuestline / getQuestlineDetail', () => {
	it('moves quests into a questline and computes progress', () => {
		const questline = createQuestline(db, { title: 'Marketing', now: 10 });
		const quest = createQuest(db, {
			title: 'Write copy',
			objective: 'Draft homepage copy',
			now: 10,
		});

		moveQuestToQuestline(db, quest.id, questline.id, 20);
		let row = db.prepare('SELECT questline_id FROM quests WHERE id = ?').get(quest.id);
		strictEqual(Number(row?.questline_id ?? 0), questline.id);

		const detail = getQuestlineDetail(db, questline.id, 20);
		strictEqual(detail.totalQuests, 1);
		strictEqual(detail.openQuests, 1);

		detachQuestFromQuestline(db, quest.id, 30);
		row = db.prepare('SELECT questline_id FROM quests WHERE id = ?').get(quest.id);
		strictEqual(row?.questline_id ?? null, null);
	});
});
