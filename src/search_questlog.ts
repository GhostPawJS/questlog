import type { QuestlogDb } from './database';
import type { QuestlogSearchResult } from './search_result';

/**
 * Full-text search across quest and rumor content.
 */
export function searchQuestlog(db: QuestlogDb, query: string): QuestlogSearchResult[] {
	const trimmed = query.trim();
	if (!trimmed) {
		return [];
	}

	const questRows = db
		.prepare(
			`SELECT q.id, q.title, snippet(quests_fts, 1, '[', ']', '…', 10) AS snippet
       FROM quests_fts
       JOIN quests q ON q.id = quests_fts.rowid
       WHERE quests_fts MATCH ? AND q.deleted_at IS NULL`,
		)
		.all(trimmed)
		.map((row) => ({
			entityKind: 'quest' as const,
			entityId: Number(row.id),
			title: String(row.title),
			snippet: String(row.snippet),
		}));

	const rumorRows = db
		.prepare(
			`SELECT r.id, r.title, snippet(rumors_fts, 1, '[', ']', '…', 10) AS snippet
       FROM rumors_fts
       JOIN rumors r ON r.id = rumors_fts.rowid
       WHERE rumors_fts MATCH ? AND r.deleted_at IS NULL`,
		)
		.all(trimmed)
		.map((row) => ({
			entityKind: 'rumor' as const,
			entityId: Number(row.id),
			title: String(row.title),
			snippet: String(row.snippet),
		}));

	return [...questRows, ...rumorRows];
}
