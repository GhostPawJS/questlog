import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { assertActiveRowExists } from './assert_active_row_exists';
import type { QuestlogDb } from './database';
import { createInitializedQuestlogDb } from './lib/test-db';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('assertActiveRowExists', () => {
	it('does not throw when row exists and is not soft-deleted', () => {
		const r = db
			.prepare(
				'INSERT INTO quests (title, objective, created_at, updated_at, effort_seconds, all_day) VALUES (?, ?, 1, 1, 0, 0)',
			)
			.run('T', 'O');
		const id = Number(r.lastInsertRowid);
		assertActiveRowExists(db, 'quests', id, 'Quest');
	});

	it('throws when id is missing', () => {
		throws(
			() => assertActiveRowExists(db, 'quests', 999_999, 'Quest'),
			/Quest 999999 was not found/,
		);
	});

	it('throws when row is soft-deleted', () => {
		const r = db
			.prepare(
				'INSERT INTO quests (title, objective, created_at, updated_at, effort_seconds, all_day, deleted_at) VALUES (?, ?, 1, 1, 0, 0, 2)',
			)
			.run('T', 'O');
		const id = Number(r.lastInsertRowid);
		throws(
			() => assertActiveRowExists(db, 'quests', id, 'Quest'),
			new RegExp(`Quest ${id} was not found`),
		);
	});

	it('is deterministic for the same db state (no race in sync sqlite)', () => {
		const r = db
			.prepare(
				'INSERT INTO quests (title, objective, created_at, updated_at, effort_seconds, all_day) VALUES (?, ?, 1, 1, 0, 0)',
			)
			.run('A', 'B');
		const id = Number(r.lastInsertRowid);
		assertActiveRowExists(db, 'quests', id, 'Quest');
		assertActiveRowExists(db, 'quests', id, 'Quest');
		strictEqual(
			Number(db.prepare('SELECT COUNT(*) AS c FROM quests WHERE id = ?').get(id)?.c ?? 0),
			1,
		);
	});
});
