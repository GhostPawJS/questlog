import type { QuestlogDb } from '../database';
import { initQuestlogTables } from '../init_questlog_tables';
import { openTestDatabase } from './open-test-database';

/** In-memory DB with full questlog schema — shared by tests. */
export async function createInitializedQuestlogDb(): Promise<QuestlogDb> {
	const db = await openTestDatabase();
	initQuestlogTables(db);
	return db;
}
