import type { QuestlogDb } from './database.ts';
import { generateAnchorsUntil } from './repeatable_quests/generate_anchors_until.ts';
import { mapRepeatableQuestRow } from './repeatable_quests/map_repeatable_quest_row.ts';
import { normalizeTagName } from './tags/normalize_tag_name.ts';
import { withTransaction } from './with_transaction.ts';

export interface DueItem {
	kind: 'quest' | 'occurrence';
	key: string;
	questId?: number;
	repeatableId?: number;
	occurrenceAt?: number;
	title: string;
	dueAt: number;
	overdue: boolean;
	tags: string[];
}
export interface DueInput {
	within?: string;
	tags?: string[];
	limit?: number;
	claim?: string;
	release?: string;
}
export function dueWithin(value = '0m'): number {
	const match = /^(\d+)(m|h|d)$/.exec(value);
	if (!match) throw new Error('within must be a duration such as 15m, 2h, or 7d');
	const ms = Number(match[1]) * { m: 60000, h: 3600000, d: 86400000 }[match[2] as 'm' | 'h' | 'd'];
	if (!Number.isSafeInteger(ms)) throw new Error('within is too large');
	return ms;
}
export function initDueTables(db: QuestlogDb): void {
	db.exec(`CREATE TABLE IF NOT EXISTS due_claims (
 consumer TEXT NOT NULL, item_key TEXT NOT NULL, claimed_at INTEGER NOT NULL,
 PRIMARY KEY (consumer, item_key));
 CREATE INDEX IF NOT EXISTS idx_quests_due_selection ON quests(COALESCE(due_at, spawned_for_at), id)
 WHERE deleted_at IS NULL AND resolved_at IS NULL;
 CREATE INDEX IF NOT EXISTS idx_questlines_due_selection ON questlines(due_at) WHERE deleted_at IS NULL;`);
}
/** Select and optionally claim a bounded, ordered batch atomically. */
export function selectDue(
	db: QuestlogDb,
	input: DueInput = {},
	now = Date.now(),
): { items: DueItem[]; hasMore: boolean; released?: boolean } {
	const horizon = now + dueWithin(input.within);
	const limit = input.limit ?? 100;
	if (!Number.isSafeInteger(horizon) || !Number.isInteger(limit) || limit < 1 || limit > 1000)
		throw new Error('limit must be between 1 and 1000 and horizon must be a valid timestamp');
	if (input.claim !== undefined && !input.claim.trim())
		throw new Error('claim must be a nonempty consumer');
	if (
		input.release !== undefined &&
		(!input.claim || !/^(?:\d+|quest:\d+|occurrence:\d+:-?\d+)$/.test(input.release))
	)
		throw new Error(
			'release requires claim and a quest id or occurrence:<repeatableId>:<timestamp>',
		);
	const required = (input.tags ?? []).map(normalizeTagName);
	return withTransaction(db, () => {
		if (input.release !== undefined) {
			const key = /^\d+$/.test(input.release) ? `quest:${input.release}` : input.release;
			const deleted = db
				.prepare('DELETE FROM due_claims WHERE consumer = ? AND item_key = ?')
				.run(input.claim as string, key);
			return { items: [], hasMore: false, released: Number(deleted.changes) > 0 };
		}
		const items: DueItem[] = [];
		const tagsFor = (id: number, repeatable = false): string[] =>
			db
				.prepare(
					`SELECT t.name FROM ${repeatable ? 'repeatable_quest_tags' : 'quest_tags'} qt JOIN tags t ON t.id = qt.tag_id WHERE qt.${repeatable ? 'repeatable_quest_id' : 'quest_id'} = ? AND qt.deleted_at IS NULL AND t.deleted_at IS NULL ORDER BY t.normalized_name`,
				)
				.all(id)
				.map((row) => String(row.name));
		const add = (item: DueItem) => {
			if (
				item.dueAt > horizon ||
				!required.every((tag) => item.tags.some((t) => normalizeTagName(t) === tag))
			)
				return;
			if (
				input.claim &&
				db
					.prepare('SELECT 1 FROM due_claims WHERE consumer = ? AND item_key = ?')
					.get(input.claim, item.key)
			)
				return;
			items.push(item);
			items.sort((a, b) => a.dueAt - b.dueAt || a.key.localeCompare(b.key));
			if (items.length > limit + 1) items.pop();
		};
		// Both branches use due indexes; questline inheritance uses its due index and the questline FK index.
		const itemKey =
			"CASE WHEN q.spawned_from_repeatable_id IS NULL THEN 'quest:' || q.id ELSE 'occurrence:' || q.spawned_from_repeatable_id || ':' || q.spawned_for_at END";
		const filter = `AND NOT EXISTS (SELECT 1 FROM due_claims c WHERE c.consumer = ? AND c.item_key = ${itemKey}) ${required.map(() => `AND EXISTS (SELECT 1 FROM quest_tags qt JOIN tags t ON t.id = qt.tag_id WHERE qt.quest_id = q.id AND qt.deleted_at IS NULL AND t.deleted_at IS NULL AND t.normalized_name = ?)`).join(' ')}`;
		const rows = db
			.prepare(`SELECT * FROM (
 SELECT q.*, COALESCE(q.due_at, q.spawned_for_at) AS selected_due FROM quests q INDEXED BY idx_quests_due_selection
 WHERE q.deleted_at IS NULL AND q.resolved_at IS NULL AND COALESCE(q.due_at, q.spawned_for_at) <= ? ${filter}
 UNION ALL SELECT q.*, l.due_at AS selected_due FROM questlines l INDEXED BY idx_questlines_due_selection CROSS JOIN quests q INDEXED BY idx_quests_questline_id ON q.questline_id = l.id
 WHERE l.deleted_at IS NULL AND l.due_at <= ? AND q.deleted_at IS NULL AND q.resolved_at IS NULL AND q.due_at IS NULL AND q.spawned_for_at IS NULL ${filter})
 ORDER BY selected_due, id LIMIT ?`)
			.all(
				horizon,
				input.claim ?? null,
				...required,
				horizon,
				input.claim ?? null,
				...required,
				limit + 1,
			);
		for (const row of rows) {
			const dueAt = Number(row.selected_due);
			const recurring = row.spawned_from_repeatable_id != null;
			const id = Number(row.id);
			add({
				kind: recurring ? 'occurrence' : 'quest',
				key: recurring
					? `occurrence:${row.spawned_from_repeatable_id}:${row.spawned_for_at}`
					: `quest:${id}`,
				...(recurring
					? {
							repeatableId: Number(row.spawned_from_repeatable_id),
							occurrenceAt: Number(row.spawned_for_at),
						}
					: { questId: id }),
				title: String(row.title),
				dueAt,
				overdue: dueAt < now,
				tags: tagsFor(id),
			});
		}
		for (const row of db
			.prepare('SELECT * FROM repeatable_quests WHERE deleted_at IS NULL AND archived_at IS NULL')
			.all()) {
			const r = mapRepeatableQuestRow(row);
			const offset = (r.dueOffsetSeconds ?? 0) * 1000;
			const tags = tagsFor(r.id, true);
			if (!required.every((tag) => tags.some((t) => normalizeTagName(t) === tag))) continue;
			let accepted = 0;
			for (const at of generateAnchorsUntil(r, horizon - offset)) {
				if (
					db
						.prepare(
							'SELECT 1 FROM quests WHERE spawned_from_repeatable_id = ? AND spawned_for_at = ?',
						)
						.get(r.id, at)
				)
					continue;
				const key = `occurrence:${r.id}:${at}`;
				if (
					input.claim &&
					db
						.prepare('SELECT 1 FROM due_claims WHERE consumer = ? AND item_key = ?')
						.get(input.claim, key)
				)
					continue;
				const dueAt = at + offset;
				add({
					kind: 'occurrence',
					key: `occurrence:${r.id}:${at}`,
					repeatableId: r.id,
					occurrenceAt: at,
					title: r.title,
					dueAt,
					overdue: dueAt < now,
					tags,
				});
				if (++accepted >= limit + 1) break;
			}
		}
		items.sort((a, b) => a.dueAt - b.dueAt || a.key.localeCompare(b.key));
		const selected = items.slice(0, limit);
		if (input.claim)
			for (const item of selected)
				db.prepare('INSERT INTO due_claims(consumer, item_key, claimed_at) VALUES (?, ?, ?)').run(
					input.claim,
					item.key,
					now,
				);
		return { items: selected, hasMore: items.length > limit };
	});
}
