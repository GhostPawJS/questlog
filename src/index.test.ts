import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as questlog from './index.ts';

describe('package index (public entry)', () => {
	it('exposes the intentional public surface', () => {
		strictEqual(typeof questlog.read, 'object');
		strictEqual(typeof questlog.skills, 'object');
		strictEqual(typeof questlog.tools, 'object');
		strictEqual(typeof questlog.write, 'object');
		strictEqual(typeof questlog.initQuestlogTables, 'function');
		strictEqual(typeof questlog.searchQuestlog, 'function');
		strictEqual(typeof questlog.createQuest, 'function');
		strictEqual(typeof questlog.listAvailableQuests, 'function');
		strictEqual(typeof questlog.deriveQuestMarkerId, 'function');
		strictEqual(typeof questlog.deriveRumorMarkerId, 'function');
		strictEqual(typeof questlog.markerLookup, 'object');

		strictEqual('getQuestOrThrow' in questlog.read, false);
		strictEqual('getRumorOrThrow' in questlog.read, false);
		strictEqual('deriveQuestMarkerId' in questlog.read, false);
		strictEqual('markerLookup' in questlog.read, false);

		strictEqual('resolveQuest' in questlog, false);
		strictEqual('getQuestOrThrow' in questlog, false);
		strictEqual('getRumorOrThrow' in questlog, false);
		strictEqual('mapQuestRow' in questlog, false);
		strictEqual('parseRRule' in questlog, false);
		strictEqual('wouldCreateUnlockCycle' in questlog, false);
	});
});
