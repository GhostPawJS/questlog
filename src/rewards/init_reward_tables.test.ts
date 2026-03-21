import { strictEqual } from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';
import { initRewardTables } from './init_reward_tables.ts';

describe('initRewardTables', () => {
	it('is idempotent when quests and repeatable_quests exist', () => {
		const db = new DatabaseSync(':memory:');
		db.exec('CREATE TABLE quests (id INTEGER PRIMARY KEY)');
		db.exec('CREATE TABLE repeatable_quests (id INTEGER PRIMARY KEY)');
		initRewardTables(db);
		initRewardTables(db);
		strictEqual(
			Number(
				db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE name = 'quest_rewards'").get()
					?.c ?? 0,
			),
			1,
		);
	});
});
