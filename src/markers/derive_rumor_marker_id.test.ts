import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deriveRumorMarkerId } from './derive_rumor_marker_id';

describe('deriveRumorMarkerId', () => {
	it('returns available attention for open rumors', () => {
		strictEqual(deriveRumorMarkerId({ state: 'open' }), 'attention.available');
	});

	it('returns null for settled rumors', () => {
		strictEqual(deriveRumorMarkerId({ state: 'settled' }), null);
	});

	it('returns null for dismissed rumors', () => {
		strictEqual(deriveRumorMarkerId({ state: 'dismissed' }), null);
	});
});
