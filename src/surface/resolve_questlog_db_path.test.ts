import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { resolveQuestlogDbPath } from './resolve_questlog_db_path.ts';

test('database path precedence is flag, environment, home default', () => {
	assert.equal(
		resolveQuestlogDbPath({ flag: ':memory:', env: { GHOSTPAW_QUESTLOG_DB: 'env' } }),
		':memory:',
	);
	assert.equal(resolveQuestlogDbPath({ env: { GHOSTPAW_QUESTLOG_DB: 'env' } }), 'env');
	assert.equal(resolveQuestlogDbPath({ env: {} }), join(homedir(), '.ghostpaw', 'questlog.db'));
});

test('empty environment path uses the default', () => {
	assert.equal(
		resolveQuestlogDbPath({ env: { GHOSTPAW_QUESTLOG_DB: '' } }),
		resolveQuestlogDbPath({ env: {} }),
	);
});
