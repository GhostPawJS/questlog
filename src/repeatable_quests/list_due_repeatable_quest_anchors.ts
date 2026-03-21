import type { QuestlogDb } from '../database.ts';
import { generateAnchorsUntil } from './generate_anchors_until.ts';
import { mapRepeatableQuestRow } from './map_repeatable_quest_row.ts';
import type { DueRepeatableAnchor } from './types.ts';

/**
 * Lists recurrence anchors that should be materialized into concrete quests.
 */
export function listDueRepeatableQuestAnchors(db: QuestlogDb, now: number): DueRepeatableAnchor[] {
	const repeatables = db
		.prepare(
			`SELECT *
       FROM repeatable_quests
       WHERE deleted_at IS NULL
         AND archived_at IS NULL`,
		)
		.all()
		.map(mapRepeatableQuestRow);

	const anchors: DueRepeatableAnchor[] = [];
	if (repeatables.length === 0) {
		return anchors;
	}

	const repeatableIds = repeatables.map((repeatable) => repeatable.id);
	const maxAnchorAt = Math.max(
		...repeatables.map((repeatable) => Math.max(repeatable.anchorAt, now)),
	);
	const existingRows = db
		.prepare(
			`SELECT spawned_from_repeatable_id, spawned_for_at
       FROM quests
       WHERE spawned_from_repeatable_id IN (${repeatableIds.map(() => '?').join(', ')})
         AND spawned_for_at IS NOT NULL
         AND spawned_for_at <= ?`,
		)
		.all(...repeatableIds, maxAnchorAt);
	const existingAnchors = new Set(
		existingRows.map(
			(row) => `${Number(row.spawned_from_repeatable_id)}:${Number(row.spawned_for_at)}`,
		),
	);

	for (const repeatable of repeatables) {
		const dueAnchors = generateAnchorsUntil(repeatable, now);
		for (const anchorAt of dueAnchors) {
			if (!existingAnchors.has(`${repeatable.id}:${anchorAt}`)) {
				anchors.push({
					repeatableQuestId: repeatable.id,
					anchorAt,
					markerId: 'attention.available.repeatable',
				});
			}
		}
	}

	return anchors.sort(
		(a, b) => a.anchorAt - b.anchorAt || a.repeatableQuestId - b.repeatableQuestId,
	);
}
