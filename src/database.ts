import type { DatabaseSync } from 'node:sqlite';

/**
 * SQLite dependency injected into every questlog operation.
 */
export type QuestlogDb = DatabaseSync;
