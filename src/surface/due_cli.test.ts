import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { runToolCli } from '../surfaces/cli.ts';
import { formatPlainDate } from './plain_dates.ts';
import { questlogCliOptions } from './questlog_cli_options.ts';
import { questlogPlainCommands } from './questlog_plain_commands.ts';

test('due CLI JSON, text, claims, release, limits and tick counts', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-due-cli-'));
	const run = async (args: string[]) => {
		let out = '',
			err = '';
		const code = await runToolCli(['--db', join(dir, 'work.db'), ...args], {
			...questlogCliOptions,
			stdin: Readable.from([]),
			stdout: new Writable({
				write(c, _e, done) {
					out += String(c);
					done();
				},
			}),
			stderr: new Writable({
				write(c, _e, done) {
					err += String(c);
					done();
				},
			}),
		});
		return { code, out, err };
	};
	try {
		assert.equal((await run(['add', 'late', '--due', '100', '--tag', 'work'])).code, 0);
		assert.equal((await run(['add', 'also late', '--due', '101'])).code, 0);
		const first = await run(['due', '--claim', 'a', '--tag', 'work', '--json']);
		assert.equal(first.code, 0, first.err);
		const data = JSON.parse(first.out).data;
		assert.equal(data.items.length, 1);
		assert.equal(data.hasMore, false);
		assert.equal(data.items[0].dueAt, 100);
		assert.deepEqual(data.items[0].tags, ['work']);
		assert.equal(
			(await run(['due'])).out,
			`quest:1  overdue  ${formatPlainDate(100, true)}  late #work\nquest:2  overdue  ${formatPlainDate(101, true)}  also late\n`,
		);
		assert.equal((await run(['due', '--claim', 'a', '--tag', 'work'])).out, '');
		assert.equal(
			(await run(['due', '--claim', 'a', '--release', String(data.items[0].questId)])).code,
			0,
		);
		assert.equal(
			(await run(['due', '--claim', 'a', '--tag', 'work'])).out.trim().split('\n').length,
			1,
		);
		assert.equal(JSON.parse((await run(['due', '--limit', '1', '--json'])).out).data.hasMore, true);
		assert.notEqual((await run(['due', '--limit', '1001'])).code, 0);
		assert.notEqual((await run(['due', '--within', '-1h'])).code, 0);
		assert.match((await run(['tick', '--claim', 'tick'])).out, /2 due items claimed/);
		assert.match((await run(['tick', '--claim', 'tick'])).out, /0 due items claimed/);
		const help = await run(['due', '--help']);
		assert.match(help.out, /--release/);
		assert.match(help.out, /--within/);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('due text formats occurrence keys, local dates, tags and single-line titles', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		const due = questlogPlainCommands().find((command) => command.spec.command === 'due');
		assert.ok(due);
		const dueAt = new Date(2026, 9, 24, 1, 2).getTime();
		const item = {
			kind: 'occurrence',
			key: 'occurrence:1:1792796520000',
			repeatableId: 1,
			occurrenceAt: 1792796520000,
			dueAt,
			overdue: true,
			title: 'nightly\r\nreview',
			tags: [],
		};
		assert.equal(
			due.render({ data: { items: [item] } }, db, {}),
			'occurrence:1:1792796520000  overdue  24 Oct 2026 01:02  nightly review\n',
		);
		assert.equal(
			due.render(
				{ data: { items: [{ ...item, overdue: false, tags: ['ops', 'social'] }] } },
				db,
				{},
			),
			'occurrence:1:1792796520000  due  24 Oct 2026 01:02  nightly review #ops #social\n',
		);
		assert.equal(due.render({ data: { items: [] } }, db, {}), '');
		assert.equal(
			due.render({ summary: 'Released', data: { released: true } }, db, {}),
			'Released\n',
		);
	} finally {
		db.close();
	}
});
