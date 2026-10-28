import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { runToolCli } from '../surfaces/cli.ts';
import { questlogCliOptions } from './questlog_cli_options.ts';

test('only add --objective reads @file; titles, outcomes and tool flags stay literal', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-file-values-'));
	const path = join(dir, 'work.db');
	const run = async (args: string[]) => {
		let out = '';
		let err = '';
		const sink = (write: (text: string) => void) =>
			new Writable({
				write(chunk, _encoding, done) {
					write(String(chunk));
					done();
				},
			});
		const code = await runToolCli(['--db', path, ...args], {
			...questlogCliOptions,
			stdin: Readable.from([]),
			stdout: sink((text) => {
				out += text;
			}),
			stderr: sink((text) => {
				err += text;
			}),
		});
		return { code, out, err };
	};
	try {
		const objective = join(dir, 'objective.md');
		writeFileSync(objective, 'Objective from a file');
		const literal = await run(['add', '@/etc/passwd', '--json']);
		assert.equal(literal.code, 0, literal.err);
		const quest = JSON.parse(literal.out).data.quest;
		assert.equal(quest.title, '@/etc/passwd');
		assert.equal(quest.objective, '@/etc/passwd');
		const fromFile = await run(['add', 'Report', '--objective', `@${objective}`, '--json']);
		assert.equal(JSON.parse(fromFile.out).data.quest.objective, 'Objective from a file');
		const escaped = await run(['add', 'Escaped', '--objective', '@@team', '--json']);
		assert.equal(JSON.parse(escaped.out).data.quest.objective, '@team');
		const done = await run(['done', String(quest.id), '--outcome', '@/etc/passwd', '--json']);
		assert.equal(done.code, 0, done.err);
		assert.ok(JSON.stringify(JSON.parse(done.out)).includes('"@/etc/passwd"'));
		assert.ok(!done.out.includes('root:'));
		const tool = await run(['capture_rumor', '--title', '@/etc/passwd', '--details', '@@x']);
		assert.equal(tool.code, 0, tool.err);
		const rumor = JSON.stringify(JSON.parse(tool.out));
		assert.ok(rumor.includes('"@/etc/passwd"') && rumor.includes('"@@x"'), rumor);
		const empty = await run(['add', 'T', '--objective', '@']);
		assert.equal(empty.code, 2);
		assert.match(empty.err, /Empty file path for objective; use @@ for a literal leading @/);
		const missing = await run(['add', 'T', '--objective', `@${join(dir, 'missing.md')}`]);
		assert.equal(missing.code, 2);
		assert.match(missing.err, /Cannot read value file for objective: .*missing\.md \(use @@/);
		assert.doesNotMatch(missing.err, /ENOENT/);
		const help = await run(['add', '--help']);
		assert.match(help.out, /--objective {2}string \(@file, @- stdin, @@ literal @\)/);
		assert.doesNotMatch(help.out, /--title {2}string \(@file/);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
