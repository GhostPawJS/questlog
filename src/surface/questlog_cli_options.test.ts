import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { runToolCli } from '../surfaces/cli.ts';
import { questlogCliOptions } from './questlog_cli_options.ts';

test('questlog plain add, search, show and not found use a file database', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-cli-'));
	try {
		const invoke = async (args: string[]) => {
			let out = '';
			const code = await runToolCli([...args, '--db', join(dir, 'test.db'), '--json'], {
				...questlogCliOptions,
				stdin: Readable.from([]),
				stdout: new Writable({
					write(chunk, _encoding, cb) {
						out += String(chunk);
						cb();
					},
				}),
				stderr: new Writable({
					write(_chunk, _encoding, cb) {
						cb();
					},
				}),
			});
			return { code, result: JSON.parse(out) };
		};
		const added = await invoke(['add', '--title', 'Deploys happen on Tuesdays']);
		assert.equal(added.code, 0);
		assert.equal(added.result.ok, true);
		const found = await invoke(['search', 'deploys']);
		assert.equal(found.code, 0);
		const id = found.result.data.items[0].id;
		assert.equal((await invoke(['show', String(id)])).code, 0);
		const missing = await invoke(['show', '99999']);
		assert.equal(missing.result.ok, false);
		assert.notEqual(missing.code, 0);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
