import type { QuestReward } from './types';

/**
 * Maps a quest reward row into its public entity shape.
 */
export function mapQuestRewardRow(row: Record<string, unknown>): QuestReward {
	return {
		id: Number(row.id),
		questId: Number(row.quest_id),
		kind: String(row.kind),
		name: String(row.name),
		description: row.description == null ? null : String(row.description),
		quantity: row.quantity == null ? null : Number(row.quantity),
		createdAt: Number(row.created_at),
		claimedAt: row.claimed_at == null ? null : Number(row.claimed_at),
		deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
	};
}
