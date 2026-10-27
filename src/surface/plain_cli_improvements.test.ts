import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkNodeVersion } from '../check_node_version.ts';
import { enrichPlainJson, suggestCommand } from '../surfaces/cli_output.ts';
import { renderSkillMarkdown } from '../surfaces/skill_markdown.ts';
import { formatPlainDate, parsePlainDue } from './plain_dates.ts';
import { questlogPlainCommands } from './questlog_plain_commands.ts';
import { questlogSkillSpec } from './questlog_skill_spec.ts';

function capture(args: string[], env = process.env, executable = process.execPath) {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-capture-'));
	const out = join(dir, 'stdout');
	const err = join(dir, 'stderr');
	const stdout = openSync(out, 'w');
	const stderr = openSync(err, 'w');
	try {
		const { NODE_TEST_CONTEXT: _context, ...childEnv } = env;
		const child = spawnSync(executable, args, {
			stdio: ['ignore', stdout, stderr],
			env: childEnv,
		});
		assert.ifError(child.error);
		return {
			status: child.status,
			stdout: readFileSync(out, 'utf8'),
			stderr: readFileSync(err, 'utf8'),
		};
	} finally {
		closeSync(stdout);
		closeSync(stderr);
		rmSync(dir, { recursive: true, force: true });
	}
}

test('version guard rejects old Node before importing CLI modules', () => {
	let error = '';
	assert.equal(
		checkNodeVersion('20.19.0', {
			write: (value) => {
				error += value;
			},
		}),
		false,
	);
	assert.equal(
		error,
		'questlog needs Node 24+ (found 20.19.0). Install Node 24+ (e.g. via nvm, mise or your package manager) or put it first on PATH.\n',
	);
	assert.equal(checkNodeVersion('24.0.0', { write: () => assert.fail() }), true);
	const entry = readFileSync('src/cli.ts', 'utf8');
	assert.deepEqual(
		[...entry.matchAll(/^import .*$/gm)].map((match) => match[0]),
		["import { checkNodeVersion } from './check_node_version.ts';"],
	);
	const child = capture([
		'--experimental-strip-types',
		'--input-type=module',
		'-e',
		"Object.defineProperty(process.versions, 'node', {value:'20.19.0'}); await import('./src/cli.ts');",
	]);
	assert.equal(child.status, 2);
	assert.equal(child.stderr, error);
});

test('local due dates, date formatting, tags and usage errors', () => {
	const now = new Date(2026, 9, 27, 12).getTime();
	const end = new Date(2026, 9, 28, 23, 59, 59, 999).getTime();
	for (const value of ['2026-10-28', '28.10.2026', 'tomorrow', '+1d'])
		assert.equal(parsePlainDue(value, now), end);
	assert.equal(parsePlainDue('today', now), new Date(2026, 9, 27, 23, 59, 59, 999).getTime());
	assert.equal(parsePlainDue('2026-10-28T12:30:00+02:00'), Date.parse('2026-10-28T10:30:00Z'));
	assert.equal(parsePlainDue('1000'), 1000);
	for (const value of ['bad', '2026-02-30', '31.04.2026'])
		assert.throws(() => parsePlainDue(value), /Invalid --due/);
	assert.equal(formatPlainDate(end, false, now), '28 Oct');
	assert.equal(
		formatPlainDate(new Date(2026, 9, 28, 12, 30).getTime(), true, now),
		'28 Oct 2026 12:30',
	);
	const add = questlogPlainCommands().find((command) => command.spec.command === 'add');
	assert.deepEqual(
		(add?.input({ title: 'Tags', tag: [' a,b, ', 'c'] }).quest as { tags: string[] }).tags,
		['a', 'b', 'c'],
	);
});

test('plain JSON recursively adds ISO siblings without changing tool data', () => {
	const original = { quest: { createdAt: 0, dueAt: null, nested: [{ resolvedAt: 1000 }] } };
	assert.deepEqual(enrichPlainJson(original), {
		quest: {
			createdAt: 0,
			createdAtIso: '1970-01-01T00:00:00.000Z',
			dueAt: null,
			nested: [{ resolvedAt: 1000, resolvedAtIso: '1970-01-01T00:00:01.000Z' }],
		},
	});
	assert.equal('createdAtIso' in original.quest, false);
	assert.equal(suggestCommand('lsit', ['list', 'show']), 'list');
	assert.equal(suggestCommand('abcdefgh', ['list']), undefined);
});

test('skill cheat sheet wraps an otherwise unchanged appendix', () => {
	const { cheatSheet: _cheatSheet, ...spec } = questlogSkillSpec;
	const original = renderSkillMarkdown(spec);
	const withSheet = renderSkillMarkdown({ ...spec, cheatSheet: 'Quick commands' });
	const title = '# questlog\n\n';
	const start = original.indexOf(title) + title.length;
	assert.equal(
		withSheet,
		`${original.slice(0, start)}Quick commands\n\n## Appendix: MCP and tool calls\n\n${original.slice(start).replace(/^## /gm, '### ')}`,
	);
	assert.equal(renderSkillMarkdown(spec), original);
});

test('skill cheat sheet opens with the npx fallback and says to search before add', () => {
	const lines = questlogSkillSpec.cheatSheet.split('\n');
	assert.equal(lines[0], 'No install? Use `npx -y @ghostpaw/questlog <command>`.');
	assert.ok(lines.includes('- `questlog search <words>` before `add` to avoid duplicates.'));
	assert.ok(
		lines.indexOf('- `questlog search <words>` before `add` to avoid duplicates.') <
			lines.findIndex((line) => line.startsWith('- `questlog add')),
	);
});

test('installer aliases preserve unrelated commands and package exposes both names', () => {
	const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
	assert.equal(pkg.bin.questlog, pkg.bin['ghostpaw-questlog']);
	assert.match(readFileSync('install.sh', 'utf8'), /ln -sf "\$BIN" "\$DIR\/questlog"/);
	assert.match(readFileSync('install.sh', 'utf8'), /readlink/);
	assert.match(readFileSync('install.ps1', 'utf8'), /Get-FileHash \$AliasPath/);
});

test('help resolves database options and opening reports creation once', async () => {
	const { mkdtempSync, rmSync } = await import('node:fs');
	const { tmpdir } = await import('node:os');
	const { join, resolve } = await import('node:path');
	const dir = mkdtempSync(join(tmpdir(), 'questlog-plain-'));
	try {
		const db = join(dir, 'work.db');
		const run = (args: string[]) =>
			capture(['--experimental-strip-types', 'src/cli.ts', ...args], {
				...process.env,
				TZ: 'Europe/Berlin',
				GHOSTPAW_QUESTLOG_DB: db,
			});
		const help = run(['--help']);
		assert.equal(help.status, 0, help.stderr);
		assert.match(help.stdout, new RegExp(`Database: ${db}`));
		assert.match(help.stdout, /GHOSTPAW_QUESTLOG_DB/);
		assert.match(
			run(['--db', 'relative.db', '--help']).stdout,
			new RegExp(`Database: ${resolve('relative.db')}`),
		);
		assert.equal(run(['list']).stderr, `created ${db}\n`);
		assert.equal(run(['list']).stderr, '');
		assert.equal(run(['--db', ':memory:', 'list']).stderr, '');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('shell installer creates and refreshes its alias but preserves unrelated files', async () => {
	const { writeFileSync, readlinkSync, unlinkSync } = await import('node:fs');
	const dir = mkdtempSync(join(tmpdir(), 'questlog-alias-'));
	try {
		const source = readFileSync('install.sh', 'utf8');
		const start = source.indexOf('if { [ ! -e "$DIR/questlog" ]');
		const end = source.indexOf('\nfi', start) + 3;
		assert.ok(start > 0);
		const script = `say() { printf '%s\\n' "$*" >&2; }\n${source.slice(start, end)}`;
		const run = () =>
			capture(['-c', script], { ...process.env, DIR: dir, BIN: 'ghostpaw-questlog' }, '/bin/sh');
		writeFileSync(join(dir, 'ghostpaw-questlog'), 'binary');
		assert.equal(run().status, 0);
		assert.equal(readlinkSync(join(dir, 'questlog')), 'ghostpaw-questlog');
		assert.equal(run().status, 0);
		unlinkSync(join(dir, 'questlog'));
		writeFileSync(join(dir, 'questlog'), 'unrelated');
		assert.match(run().stderr, /Skipping/);
		assert.equal(readFileSync(join(dir, 'questlog'), 'utf8'), 'unrelated');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
