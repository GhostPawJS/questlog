import type { QuestlogDb } from '../database.ts';
import { queryQuestDetailRecords } from '../quests/query_quest_detail_records.ts';
import type { HookEvent, HookEventType } from './types.ts';

/** Detect current model occurrences; historical transitions removed before a tick cannot be reconstructed. */
export function detectHookEvents(db: QuestlogDb, now: number): HookEvent[] {
	const events: HookEvent[] = [];
	const add = (
		type: HookEventType,
		at: number,
		ids: { questId?: number; rumorId?: number; repeatableId?: number },
	) => {
		events.push({
			id: `e_${type}_${ids.questId ?? ids.rumorId}_${ids.repeatableId ?? ''}_${at}`,
			type,
			...ids,
			occurredAt: new Date(at).toISOString(),
		});
	};
	for (const { detail: q } of queryQuestDetailRecords(db, {}, now)) {
		if (q.resolvedAt == null && q.effectiveDueAt != null && q.effectiveDueAt <= now) {
			add('quest.due', q.effectiveDueAt, { questId: q.id });
			if (q.effectiveDueAt < now) add('quest.overdue', q.effectiveDueAt, { questId: q.id });
		}
		if (q.available) {
			const prerequisites = db
				.prepare(
					`SELECT p.id, p.resolved_at, u.created_at FROM quest_unlocks u JOIN quests p ON p.id = u.from_quest_id WHERE u.to_quest_id = ? AND u.deleted_at IS NULL AND p.deleted_at IS NULL AND p.success = 1 AND p.resolved_at IS NOT NULL`,
				)
				.all(q.id);
			// Only a success after the unlock was installed constitutes an unblock.
			if (prerequisites.some((p) => Number(p.resolved_at) >= Number(p.created_at))) {
				const at = Math.max(q.notBeforeAt ?? 0, ...prerequisites.map((p) => Number(p.resolved_at)));
				if (at <= now) add('quest.unblocked', at, { questId: q.id });
			}
		}
		if (q.spawnedFromRepeatableId != null && q.createdAt <= now)
			add('repeatable.spawned', q.createdAt, {
				questId: q.id,
				repeatableId: q.spawnedFromRepeatableId,
			});
	}
	for (const row of db
		.prepare('SELECT id, created_at FROM rumors WHERE deleted_at IS NULL AND created_at <= ?')
		.all(now))
		add('rumor.captured', Number(row.created_at), { rumorId: Number(row.id) });
	return events.sort(
		(a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id),
	);
}
