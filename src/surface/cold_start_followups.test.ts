import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { runToolCli } from '../surfaces/cli.ts';
import { openQuestlogDb } from './open_questlog_db.ts';
import { parsePlainDue } from './plain_dates.ts';
import { questlogCliOptions } from './questlog_cli_options.ts';

test('cold-start permissions preserve existing files and protect new files and sidecars', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-private-'));
	const path = join(dir, 'nested', 'work.db');
	try {
		const db = await openQuestlogDb(path);
		if (process.platform !== 'win32') {
			for (const file of [path, `${path}-wal`, `${path}-shm`])
				assert.equal(statSync(file).mode & 0o777, 0o600);
			assert.equal(statSync(join(dir, 'nested')).mode & 0o777, 0o700);
		}
		db.close();
		chmodSync(path, 0o640);
		(await openQuestlogDb(path)).close();
		if (process.platform !== 'win32') assert.equal(statSync(path).mode & 0o777, 0o640);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('CLI follow-ups validate inputs, redact and deliver headers, and render text or JSON', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-followup-'));
	const path = join(dir, 'work.db');
	const original = globalThis.fetch;
	let sent = 0;
	let responseStatus = 204;
	globalThis.fetch = async (_url, init) => {
		assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer hidden-value');
		assert.equal(new Headers(init?.headers).get('x-key'), 'second-value');
		assert.equal(new Headers(init?.headers).get('user-agent'), 'private-agent');
		sent++;
		return new Response(null, { status: responseStatus });
	};
	const run = async (args: string[], input = '') => {
		let out = '',
			err = '';
		const code = await runToolCli(['--db', path, ...args], {
			...questlogCliOptions,
			stdin: Readable.from([input]),
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
		for (const [args, message] of [
			[['hook', 'add', 'ftp://example.org'], /unsupported scheme ftp:; use http or https/],
			[['hook', 'add', 'https://user:pw@example.org'], /custom header.*query key/],
			[
				['hook', 'add', 'https://example.org', '--events', 'quest.bogus'],
				/unknown event quest.bogus; valid: quest.due/,
			],
			[['watch', '--interval', '2'], /--interval 2 is below the minimum of 5 seconds/],
			[['list', '--view', 'bogus'], /view.*bogus.*must be one of/],
			[['hook', 'add', 'https://example.org', '--min-gap', '-5'], /Min gap -5 must be/],
			[['add'], /questlog add "Write the report" --due tomorrow/],
		] as [string[], RegExp][]) {
			const result = await run(args);
			assert.equal(result.code, 2, result.err);
			assert.match(result.err, message);
		}
		for (const name of ['Host', 'Content-Length', 'Content-Type', 'X-Questlog-Test', 'bad name']) {
			const result = await run([
				'hook',
				'add',
				'https://example.org',
				'--header',
				`${name}: hidden-value`,
			]);
			assert.equal(result.code, 2);
			assert.doesNotMatch(result.out + result.err, /hidden-value/);
		}
		assert.equal((await run(['hook', 'list'])).out, 'No hooks\n');
		assert.equal((await run(['hook', 'list', '--json'])).out.trim(), '[]');
		for (const id of ['999', 'd_nope']) assert.equal((await run(['show', id])).code, 3);
		const added = await run(
			[
				'hook',
				'add',
				'https://example.org?token=private',
				'--header',
				'Authorization: Bearer hidden-value',
				'--header-stdin',
			],
			'X-Key: second-value\nUser-Agent: private-agent\n',
		);
		assert.equal(added.code, 0, added.err);
		assert.match(added.out, /^Created hook 1\nSecret \(shown once\): [a-f0-9]{64}\n$/);
		const tested = await run(['hook', 'test', '1', '--json']);
		assert.equal(tested.code, 0, tested.err);
		assert.equal(sent, 1);
		const deliveryId = JSON.parse(tested.out).id;
		responseStatus = 503;
		const pending = await run(['hook', 'test', '1']);
		assert.equal(pending.code, 0);
		assert.match(pending.out, /delivered: false/);
		assert.doesNotMatch(pending.out, /hidden-value|second-value/);
		assert.match((await run(['review', 'deliveries'])).out, /pending attempts 1 HTTP 503/);
		for (const args of [
			['hook', 'list'],
			['hook', 'list', '--json'],
			['show', deliveryId],
			['show', deliveryId, '--json'],
			['review', 'deliveries'],
			['list', '--view', 'deliveries'],
			['call', 'manage_hooks', '{"action":"list"}'],
			['call', 'manage_hooks', '{"action":"list"}', '--json'],
		]) {
			const result = await run(args);
			assert.equal(result.code, 0, result.err);
			assert.doesNotMatch(
				result.out + result.err,
				/hidden-value|second-value|private-agent|token=private/,
			);
			// `call` returns the raw tool result as JSON; other commands print text unless --json.
			if (args.includes('--json') || args[0] === 'call') JSON.parse(result.out);
			else assert.ok(!result.out.trim().startsWith('{') && !result.out.trim().startsWith('['));
		}
		const detail = JSON.parse((await run(['show', deliveryId, '--json'])).out);
		const textDetail = await run(['show', deliveryId]);
		assert.ok(
			textDetail.out.includes(
				new Date(detail.nextAttemptAt).toLocaleString('en-GB', { timeZoneName: 'short' }),
			),
		);
		assert.doesNotMatch((await run(['review', 'deliveries'])).out, /\d{4}-\d{2}-\d{2}T/);
		assert.equal(detail.status, 'delivered');
		assert.equal(detail.attempts, 1);
		assert.equal(detail.httpStatus, 204);
		assert.equal(detail.target.url, 'https://example.org/');
		assert.equal(detail.eventIds.length, 1);
		for (const action of ['remove', 'test']) {
			const result = await run(['hook', action, '999']);
			assert.equal(result.code, 3);
			assert.match(result.err, /999 not found/);
		}
		for (const args of [
			['shape_work', '--help'],
			['call', 'shape_work', '--help'],
		]) {
			const result = await run(args);
			assert.equal(result.code, 0);
			assert.match(result.out, /quest.title/);
			assert.doesNotMatch(result.out, /Unknown parameter/);
		}
		const skill = await run(['skill']);
		assert.doesNotMatch(skill.out, /references\//);
		assert.doesNotMatch(skill.out, /\|\s*\|\s*$/m);
		const short = await run(['skill', '--short']);
		assert.equal(short.code, 0);
		assert.ok(short.out.split('\n').length < 45);
		assert.match(short.out, /--version/);
		assert.match(short.out, /skill --list/);
		assert.match((await run(['skill', '--help'])).out, /--short/);
	} finally {
		globalThis.fetch = original;
		rmSync(dir, { recursive: true, force: true });
	}
});

test('zone-free ISO date-times use local time and invalid dates describe all accepted forms', () => {
	assert.equal(parsePlainDue('2026-10-29T09:00'), new Date(2026, 9, 29, 9).getTime());
	assert.throws(
		() => parsePlainDue('invalid'),
		/YYYY-MM-DD.*DD.MM.YYYY.*today.*tomorrow.*epoch milliseconds.*no zone means local time/,
	);
});
