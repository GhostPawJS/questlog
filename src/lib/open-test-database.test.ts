import { strictEqual, throws } from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';
import { openTestDatabase } from './open-test-database';

describe('openTestDatabase', () => {
	it('returns an isolated in-memory DatabaseSync', async () => {
		const a = await openTestDatabase();
		const b = await openTestDatabase();
		strictEqual(a instanceof DatabaseSync, true);
		a.exec('CREATE TABLE x (v INTEGER)');
		throws(() => {
			b.prepare('SELECT * FROM x').get();
		}, /no such table/i);
	});
});
