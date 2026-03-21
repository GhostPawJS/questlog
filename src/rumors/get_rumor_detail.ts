import type { QuestlogDb } from '../database.ts';
import { deriveRumorState } from './derive_rumor_state.ts';
import { getRumorOrThrow } from './get_rumor_or_throw.ts';
import { getRumorOutputs } from './get_rumor_outputs.ts';
import type { RumorDetail } from './types.ts';

/**
 * Loads a rumor with derived state and downstream outputs.
 */
export function getRumorDetail(db: QuestlogDb, rumorId: number): RumorDetail {
	const rumor = getRumorOrThrow(db, rumorId);
	return {
		...rumor,
		state: deriveRumorState(rumor),
		outputs: getRumorOutputs(db, rumorId),
	};
}
