import { DatabaseSync } from 'node:sqlite';
import type { QuestlogDb } from '../database';

/** In-memory SQLite for tests (async for compatibility with test harness patterns). */
export async function openTestDatabase(): Promise<QuestlogDb> {
	return new DatabaseSync(':memory:');
}
