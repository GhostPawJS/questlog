import type { Rumor, RumorState } from './types';

/**
 * Derives rumor state from settlement and dismissal timestamps.
 */
export function deriveRumorState(rumor: Rumor): RumorState {
	if (rumor.dismissedAt != null) {
		return 'dismissed';
	}
	if (rumor.settledAt != null) {
		return 'settled';
	}
	return 'open';
}
