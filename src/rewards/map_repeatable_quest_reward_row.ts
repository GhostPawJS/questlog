import type { RepeatableQuestReward } from './types.ts';

/**
 * Maps a repeatable quest reward row into its public entity shape.
 */
export function mapRepeatableQuestRewardRow(row: Record<string, unknown>): RepeatableQuestReward {
	return {
		id: Number(row.id),
		repeatableQuestId: Number(row.repeatable_quest_id),
		kind: String(row.kind),
		name: String(row.name),
		description: row.description == null ? null : String(row.description),
		quantity: row.quantity == null ? null : Number(row.quantity),
		createdAt: Number(row.created_at),
		deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
	};
}
