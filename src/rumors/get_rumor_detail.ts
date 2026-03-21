import type { QuestlogDb } from '../database';
import { deriveRumorState } from './derive_rumor_state';
import { getRumorOrThrow } from './get_rumor_or_throw';
import { getRumorOutputs } from './get_rumor_outputs';
import type { RumorDetail } from './types';

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
