import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { MarkerDefinition, MarkerId } from './index.ts';
import * as markers from './index.ts';

describe('markers barrel', () => {
	it('exports the marker lookup and derivation helpers', () => {
		const markerId: MarkerId = 'attention.available';
		const markerDefinition: MarkerDefinition = markers.markerLookup[markerId];

		strictEqual(typeof markers.deriveQuestMarkerId, 'function');
		strictEqual(typeof markers.deriveRumorMarkerId, 'function');
		strictEqual(markerDefinition.id, markerId);
	});
});
