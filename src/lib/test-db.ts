import type { QuestlogDb } from '../database.ts';
import { initQuestlogTables } from '../init_questlog_tables.ts';
import { openTestDatabase } from './open-test-database.ts';

/** In-memory DB with full questlog schema — shared by tests. */
export async function createInitializedQuestlogDb(): Promise<QuestlogDb> {
	const db = await openTestDatabase();
	initQuestlogTables(db);
	return db;
}
