import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as questlog from './index.ts';

describe('questlog public surface', () => {
	it('exports the intentional contract and hides internal helpers', () => {
		strictEqual('initQuestlogTables' in questlog, true);
		strictEqual('createQuest' in questlog, true);
		strictEqual('listAvailableQuests' in questlog, true);
		strictEqual('searchQuestlog' in questlog, true);
		strictEqual('deriveQuestMarkerId' in questlog, true);
		strictEqual('deriveRumorMarkerId' in questlog, true);
		strictEqual('markerLookup' in questlog, true);
		strictEqual('read' in questlog, true);
		strictEqual('write' in questlog, true);
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
