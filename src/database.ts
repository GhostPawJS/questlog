export interface QuestlogRunResult {
	lastInsertRowid: number | bigint;
	changes?: number | bigint | undefined;
}

export interface QuestlogStatement {
	run(...params: unknown[]): QuestlogRunResult;
	get<TRecord = Record<string, unknown>>(...params: unknown[]): TRecord | undefined;
	all<TRecord = Record<string, unknown>>(...params: unknown[]): TRecord[];
}

/**
 * SQLite dependency injected into every questlog operation.
 * Node.js `DatabaseSync` satisfies this interface directly.
 */
export type QuestlogDb = {
	exec(sql: string): void;
	prepare(sql: string): QuestlogStatement;
	close(): void;
};
