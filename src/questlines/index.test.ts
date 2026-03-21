import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as questlines from './index';

describe('questlines barrel', () => {
	it('exports core questline operations', () => {
		strictEqual(typeof questlines.createQuestline, 'function');
		strictEqual(typeof questlines.listQuestlines, 'function');
		strictEqual(typeof questlines.getQuestlineDetail, 'function');
		strictEqual(typeof questlines.archiveQuestline, 'function');
	});
});
