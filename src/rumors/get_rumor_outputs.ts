import type { QuestlogDb } from '../database.ts';
import type { RumorOutput } from './types.ts';

/**
 * Lists outputs that a rumor produced.
 */
export function getRumorOutputs(db: QuestlogDb, rumorId: number): RumorOutput[] {
	const questOutputs = db
		.prepare('SELECT id FROM quests WHERE source_rumor_id = ? AND deleted_at IS NULL')
		.all(rumorId)
		.map((row) => ({ entityKind: 'quest' as const, entityId: Number(row.id) }));
	const questlineOutputs = db
		.prepare('SELECT id FROM questlines WHERE source_rumor_id = ? AND deleted_at IS NULL')
		.all(rumorId)
		.map((row) => ({ entityKind: 'questline' as const, entityId: Number(row.id) }));

	return [...questOutputs, ...questlineOutputs].sort((a, b) =>
		a.entityKind === b.entityKind ? a.entityId - b.entityId : a.entityKind === 'quest' ? -1 : 1,
	);
}
