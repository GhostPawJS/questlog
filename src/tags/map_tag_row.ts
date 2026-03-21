import type { Tag } from './types.ts';

/**
 * Maps a tag row into its public entity shape.
 */
export function mapTagRow(row: Record<string, unknown>): Tag {
	return {
		id: Number(row.id),
		name: String(row.name),
		normalizedName: String(row.normalized_name),
		createdAt: Number(row.created_at),
		deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
	};
}
