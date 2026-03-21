import type { Rumor } from './types';

/**
 * Maps a rumor row into its public entity shape.
 */
export function mapRumorRow(row: Record<string, unknown>): Rumor {
	return {
		id: Number(row.id),
		title: String(row.title),
		details: row.details == null ? null : String(row.details),
		createdAt: Number(row.created_at),
		updatedAt: Number(row.updated_at),
		settledAt: row.settled_at == null ? null : Number(row.settled_at),
		dismissedAt: row.dismissed_at == null ? null : Number(row.dismissed_at),
		deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
	};
}
