import { deepStrictEqual, match, strictEqual } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

test('repeatable create/revise, invalid zones, describe, and output env', () => {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-tz-'));

	const run = (args: string[], output = '') => {
		const out = join(dir, 'out'),
			err = join(dir, 'err');
		const stdout = openSync(out, 'w'),
			stderr = openSync(err, 'w');
		const { NODE_TEST_CONTEXT: _context, ...env } = process.env;
		try {
			const result = spawnSync(
				process.execPath,
				['--experimental-strip-types', 'src/cli.ts', '--db', join(dir, 'q.db'), ...args],
				{ stdio: ['ignore', stdout, stderr], env: { ...env, GHOSTPAW_OUTPUT: output } },
			);
			return {
				status: result.status,
				stdout: readFileSync(out, 'utf8'),
				stderr: readFileSync(err, 'utf8'),
			};
		} finally {
			closeSync(stdout);
			closeSync(stderr);
		}
	};
	try {
		const created = run(
			[
				'repeatable',
				'create',
				'--title',
				'Daily',
				'--objective',
				'Work',
				'--rrule',
				'FREQ=DAILY',
				'--anchor-at',
				'2026-03-28T00:02:00+01:00',
				'--tz',
				'Europe/Berlin',
			],
			'json',
		);
		strictEqual(created.status, 0, created.stderr);
		const q = JSON.parse(created.stdout).data.repeatableQuest;
		strictEqual(q.tz, 'Europe/Berlin');
		match(run(['repeatable', 'revise', String(q.id), '--tz', 'none']).stdout, /tz: none/);
		strictEqual(run(['repeatable', 'revise', String(q.id), '--tz', 'Invalid/Zone']).status, 2);
		match(run(['describe', 'manage_repeatable']).stdout, /IANA time zone/);
		deepStrictEqual(
			JSON.parse(run(['tools'], 'json').stdout),
			JSON.parse(run(['tools', '--json']).stdout),
		);
		strictEqual(run(['tools'], 'other').stdout, run(['tools']).stdout);
		strictEqual(run(['search', '"agentpreneur:"'], 'json').status, 0);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
