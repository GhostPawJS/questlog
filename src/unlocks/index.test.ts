import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as unlocks from './index';

describe('unlocks barrel', () => {
	it('exports graph edge operations', () => {
		strictEqual(typeof unlocks.addUnlock, 'function');
		strictEqual(typeof unlocks.removeUnlock, 'function');
		strictEqual(typeof unlocks.replaceUnlocks, 'function');
	});
});
