import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as rumors from './index.ts';

describe('rumors barrel', () => {
	it('exports rumor capture and resolution helpers', () => {
		strictEqual(typeof rumors.captureRumor, 'function');
		strictEqual(typeof rumors.getRumorDetail, 'function');
		strictEqual(typeof rumors.dismissRumor, 'function');
	});
});
