import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { runToolCli } from '../surfaces/cli.ts';
import { questlogCliOptions } from './questlog_cli_options.ts';

test('CLI add/list/label/test/remove, dry-run, secret redaction, and watch signal handling', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-cli-hooks-'));
	const path = join(dir, 'demo.db');
	const originalFetch = globalThis.fetch;
	let requests = 0;
	globalThis.fetch = async () => {
		requests++;
		return new Response(null, { status: 204 });
	};
	let output = '',
		errors = '',
		stopping = false;
	const stdout = new Writable({
		write(chunk, _encoding, done) {
			output += String(chunk);
			if (stopping) process.emit('SIGTERM');
			done();
		},
	});
	const stderr = new Writable({
		write(chunk, _encoding, done) {
			errors += String(chunk);
			done();
		},
	});
	const run = async (args: string[], input = '') => {
		output = '';
		errors = '';
		const code = await runToolCli(['--db', path, ...args], {
			...questlogCliOptions,
			stdout,
			stderr,
			stdin: Readable.from([input]),
		});
		return { code, output, errors };
	};
	try {
		let result = await run([
			'hook',
			'add',
			'https://user:password@example.org/wake?token=hidden',
			'--json',
		]);
		assert.equal(result.code, 0);
		const created = JSON.parse(result.output) as { id: number; secret: string };
		assert.match(created.secret, /^[a-f0-9]{64}$/);
		const all: string[] = [];
		for (const args of [
			['hook', 'list'],
			['hook', 'list', '--json'],
			['hook', 'label', 'work'],
			['tick', '--dry-run'],
			['tick', '--dry-run', '--json'],
			['review', 'deliveries'],
			['hook', 'test', String(created.id)],
			['hook', 'test', '999'],
			['hook', 'add', 'file:///private'],
			['hook', 'add', 'https://example.org', '--secret', created.secret],
		]) {
			result = await run(args);
			all.push(result.output, result.errors);
		}
		assert.equal(requests, 1);
		for (const sentinel of [created.secret, 'password', 'hidden'])
			assert.ok(!all.join('').includes(sentinel));
		result = await run(
			['hook', 'add', 'https://example.org', '--secret-stdin', '--json'],
			'supplied-secret\n',
		);
		assert.equal(JSON.parse(result.output).secret, 'supplied-secret');
		assert.ok(!(await run(['hook', 'list', '--json'])).output.includes('supplied-secret'));
		assert.equal((await run(['hook', 'remove', String(created.id)])).code, 0);
		assert.equal(JSON.parse((await run(['hook', 'list', '--json'])).output).length, 1);
		assert.equal((await run(['watch', '--interval', '0.01'])).code, 2);
		stopping = true;
		result = await run(['watch', '--interval', '5']);
		stopping = false;
		assert.equal(result.code, 0);
		assert.match(result.output, /"events"/);
	} finally {
		globalThis.fetch = originalFetch;
		rmSync(dir, { recursive: true });
	}
});
