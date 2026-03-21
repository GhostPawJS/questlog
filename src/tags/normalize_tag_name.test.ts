import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeTagName } from './normalize_tag_name';

describe('normalizeTagName', () => {
	it('trims, lowercases, and collapses internal whitespace', () => {
		strictEqual(normalizeTagName('  Foo   Bar  '), 'foo bar');
		strictEqual(normalizeTagName('UPPER'), 'upper');
	});
});
