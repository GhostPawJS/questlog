import type { RumorState } from '../rumors/types';
import type { MarkerId } from './types';

export interface DeriveRumorMarkerIdInput {
	state: RumorState;
}

export function deriveRumorMarkerId({ state }: DeriveRumorMarkerIdInput): MarkerId | null {
	if (state === 'open') {
		return 'attention.available';
	}

	return null;
}
