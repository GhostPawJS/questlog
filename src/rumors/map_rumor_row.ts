import { deriveRumorMarkerId } from '../markers/derive_rumor_marker_id';
import { deriveRumorState } from './derive_rumor_state';
import type { Rumor } from './types';

/**
 * Maps a rumor row into its public entity shape.
 */
export function mapRumorRow(row: Record<string, unknown>): Rumor {
	const rumor: Rumor = {
		id: Number(row.id),
		title: String(row.title),
		details: row.details == null ? null : String(row.details),
		markerId: null,
		createdAt: Number(row.created_at),
		updatedAt: Number(row.updated_at),
		settledAt: row.settled_at == null ? null : Number(row.settled_at),
		dismissedAt: row.dismissed_at == null ? null : Number(row.dismissed_at),
		deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
	};

	return {
		...rumor,
		markerId: deriveRumorMarkerId({ state: deriveRumorState(rumor) }),
	};
}
