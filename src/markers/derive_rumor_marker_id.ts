import type { RumorState } from '../rumors/types.ts';
import type { MarkerId } from './types.ts';

export interface DeriveRumorMarkerIdInput {
	state: RumorState;
}

export function deriveRumorMarkerId({ state }: DeriveRumorMarkerIdInput): MarkerId | null {
	if (state === 'open') {
		return 'attention.available';
	}

	return null;
}
