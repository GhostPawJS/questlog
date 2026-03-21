import type { Questline } from './types';

/**
 * Maps a questline row into its public entity shape.
 */
export function mapQuestlineRow(row: Record<string, unknown>): Questline {
	return {
		id: Number(row.id),
		sourceRumorId: row.source_rumor_id == null ? null : Number(row.source_rumor_id),
		title: String(row.title),
		description: row.description == null ? null : String(row.description),
		startsAt: row.starts_at == null ? null : Number(row.starts_at),
		dueAt: row.due_at == null ? null : Number(row.due_at),
		createdAt: Number(row.created_at),
		updatedAt: Number(row.updated_at),
		archivedAt: row.archived_at == null ? null : Number(row.archived_at),
		deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
	};
}
