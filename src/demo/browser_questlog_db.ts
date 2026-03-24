import { loadSqlJs, type SqlJsDatabase } from './load_sqljs.ts';

function normalizeParam(value: unknown): unknown {
	if (typeof value === 'boolean') return value ? 1 : 0;
	if (value === undefined) return null;
	return value;
}

function normalizeParams(params: readonly unknown[]): unknown[] {
	return params.map(normalizeParam);
}

function readRunResult(db: SqlJsDatabase): {
	lastInsertRowid: number | bigint;
	changes: number;
} {
	const result = db.exec('SELECT last_insert_rowid() AS lastInsertRowid, changes() AS changes');
	const row = result[0]?.values[0];
	return {
		lastInsertRowid: typeof row?.[0] === 'number' || typeof row?.[0] === 'bigint' ? row[0] : 0,
		changes: Number(row?.[1] ?? 0),
	};
}

class BrowserStatement {
	constructor(
		private readonly db: SqlJsDatabase,
		private readonly sql: string,
	) {}

	run(...params: unknown[]): { lastInsertRowid: number | bigint; changes: number } {
		const bound = normalizeParams(params);
		if (bound.length === 0) {
			this.db.run(this.sql);
		} else {
			this.db.run(this.sql, bound);
		}
		return readRunResult(this.db);
	}

	get<T = unknown>(...params: unknown[]): T | undefined {
		const statement = this.db.prepare(this.sql);
		try {
			const bound = normalizeParams(params);
			if (bound.length > 0) statement.bind(bound);
			if (!statement.step()) return undefined;
			return statement.getAsObject() as T;
		} finally {
			statement.free();
		}
	}

	all<T = unknown>(...params: unknown[]): T[] {
		const statement = this.db.prepare(this.sql);
		try {
			const bound = normalizeParams(params);
			if (bound.length > 0) statement.bind(bound);
			const rows: T[] = [];
			while (statement.step()) {
				rows.push(statement.getAsObject() as T);
			}
			return rows;
		} finally {
			statement.free();
		}
	}
}

class BrowserQuestlogDb {
	constructor(private readonly db: SqlJsDatabase) {}

	exec(sql: string): void {
		this.db.run(sql);
	}

	prepare(sql: string): BrowserStatement {
		return new BrowserStatement(this.db, sql);
	}

	close(): void {
		this.db.close();
	}
}

export type { BrowserQuestlogDb };

export async function openBrowserQuestlogDb(): Promise<BrowserQuestlogDb> {
	const sqlJs = await loadSqlJs();
	return new BrowserQuestlogDb(new sqlJs.Database());
}
