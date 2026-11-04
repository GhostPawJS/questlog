import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdtempSync, openSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkNodeVersion } from '../check_node_version.ts';
import { enrichPlainJson, suggestCommand } from '../surfaces/cli_output.ts';
import { renderSkillMarkdown } from '../surfaces/skill_markdown.ts';
import { questlogVersion } from '../version.ts';
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
	const { cheatSheet: _cheatSheet, packageName: _packageName, ...spec } = questlogSkillSpec;
	const original = renderSkillMarkdown(spec);
	const withSheet = renderSkillMarkdown({
		...spec,
		cheatSheet: 'Quick commands',
	});
	const title = '# questlog\n\n';
	const start = original.indexOf(title) + title.length;
	assert.equal(
		withSheet,
		`${original.slice(0, start)}Quick commands\n\n## Appendix: MCP and tool calls\n\n${original.slice(start).replace(/^## /gm, '### ')}`,
	);
	assert.equal(renderSkillMarkdown(spec), original);
});

test('skill opens with binary installation and keeps npm in the final fallback', () => {
	const lines = questlogSkillSpec.cheatSheet.split('\n');
	assert.equal(lines[0], '## Install');
	const markdown = renderSkillMarkdown(questlogSkillSpec);
	assert.match(markdown, /# questlog\n\n## Install/);
	const fallback = markdown.indexOf('## Without the binary');
	assert.ok(fallback > markdown.indexOf('## Appendix'));
	assert.doesNotMatch(markdown.slice(markdown.indexOf('# questlog'), fallback), /npx|npm|Node/);
	assert.match(markdown.slice(fallback), /npx -y @ghostpaw\/questlog/);
	assert.ok(lines.includes('- `questlog search <words>` before `add` to avoid duplicates.'));
	assert.ok(
		lines.indexOf('- `questlog search <words>` before `add` to avoid duplicates.') <
			lines.findIndex((line) => line.startsWith('- `ghostpaw-questlog add')),
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

test('add accepts a positional title or --title and rejects both', () => {
	for (const args of [['My title'], ['--title', 'My title']]) {
		const result = capture(['src/cli.ts', '--db', ':memory:', 'add', ...args, '--json']);
		assert.equal(result.status, 0, result.stderr);
		assert.equal(JSON.parse(result.stdout).data.quest.title, 'My title');
	}
	const both = capture(['src/cli.ts', '--db', ':memory:', 'add', 'My title', '--title', 'Other']);
	assert.equal(both.status, 2);
	assert.match(both.stderr, /give the title once: either as the first argument or with --title/);
});

test('package entry reports npm for both version flags', () => {
	for (const flag of ['--version', '-v']) {
		const result = capture(['src/cli.ts', flag]);
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /^questlog \d+\.\d+\.\d+ \(npm\)\n$/);
	}
});

test('shell installer validates explicit targets and permits Rosetta', () => {
	const source = readFileSync('install.sh', 'utf8');
	const setup = source.slice(0, source.indexOf('if [ -z "$VERSION" ]'));
	const script = `uname() { case "$1" in -s) printf '%s\\n' "$TEST_OS" ;; -m) printf '%s\\n' "$TEST_ARCH" ;; esac; }\n${setup}\nprintf '%s\\n' "$OS-$ARCH"`;
	for (const [os, arch, detected] of [
		['Linux', 'x86_64', 'linux-x64'],
		['Linux', 'aarch64', 'linux-arm64'],
		['Darwin', 'arm64', 'darwin-arm64'],
		['Darwin', 'x86_64', 'darwin-x64'],
	] as const) {
		const env = { ...process.env, TEST_OS: os, TEST_ARCH: arch };
		const run = (...args: string[]) =>
			capture(['-c', script, 'install.sh', ...args], env, '/bin/sh');
		assert.equal(run().stdout.trim(), detected);
		assert.equal(run('--target', detected as string).stdout.trim(), detected);
		const wrong = detected === 'linux-x64' ? 'linux-arm64' : 'linux-x64';
		assert.match(
			run('--target', wrong).stderr,
			new RegExp(`this machine is ${detected}; use the ${detected} install line`),
		);
		assert.match(
			run('--target', 'unknown').stderr,
			/linux-x64, linux-arm64, darwin-arm64, darwin-x64/,
		);
		if (detected === 'darwin-arm64')
			assert.equal(run('--target', 'darwin-x64').stdout.trim(), 'darwin-x64');
	}
});

test('package entry supports machine version flags in every order', () => {
	const permutations = (items: string[]): string[][] =>
		items.length === 0
			? [[]]
			: items.flatMap((item, index) =>
					permutations(items.filter((_, i) => i !== index)).map((rest) => [item, ...rest]),
				);
	for (const versionFlag of ['--version', '-v']) {
		for (const formats of [['--short'], ['--json'], ['--short', '--json']]) {
			for (const args of permutations([versionFlag, ...formats])) {
				const result = capture(['src/cli.ts', ...args]);
				assert.equal(result.status, 0, result.stderr);
				assert.equal(result.stderr, '');
				assert.equal(
					result.stdout,
					formats.includes('--json')
						? `${JSON.stringify({ name: 'questlog', version: questlogVersion, variant: 'npm', target: `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch}` })}\n`
						: `${questlogVersion}\n`,
				);
			}
		}
	}
	const help = capture(['src/cli.ts', '--help']);
	assert.equal(help.status, 0, help.stderr);
	assert.match(help.stdout, /Version formats: --version --short, --version --json/);
});

test('delivery text uses local time across winter and summer including ISO event timestamps', () => {
	const result = capture(
		[
			'--input-type=module',
			'-e',
			`
 import {textOutput} from './src/surfaces/text_output.ts';
 console.log(textOutput({nextAttemptAt: Date.parse('2026-10-29T08:00:00Z'), createdAt: Date.parse('2026-07-01T07:00:00Z'), events: [{occurredAt: '2026-07-01T07:00:00Z'}]}));
 `,
		],
		{ ...process.env, TZ: 'Europe/Berlin' },
	);
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /nextAttemptAt: 29\/10\/2026, 9:00:00 CET/);
	assert.match(result.stdout, /createdAt: 01\/07\/2026, 9:00:00 CEST/);
	assert.match(result.stdout, /occurredAt: 01\/07\/2026, 9:00:00 CEST/);
	assert.doesNotMatch(result.stdout, /2026-07-01T/);
});

test('list tags filter quests with AND semantics before the display limit', () => {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-tags-'));
	try {
		const db = join(dir, 'nested', 'deeper', 'work.db');
		const run = (args: string[]) =>
			capture(['--experimental-strip-types', 'src/cli.ts', '--db', db, ...args]);
		for (const args of [
			['add', 'First', '--tag', 'work'],
			['add', 'Both', '--tag', 'work', '--tag', 'urgent'],
			['add', 'Other', '--tag', 'home'],
		]) {
			const result = run(args);
			assert.equal(result.status, 0, result.stderr);
		}
		assert.ok(existsSync(db));
		const titles = (args: string[]) => {
			const result = run(['list', '--json', ...args]);
			assert.equal(result.status, 0, result.stderr);
			return JSON.parse(result.stdout)
				.data.items.map((item: { title: string }) => item.title)
				.sort();
		};
		assert.deepEqual(titles(['--tag', ' WORK ']), ['Both', 'First']);
		assert.deepEqual(titles(['--tag', 'work', '--tag', 'urgent']), ['Both']);
		assert.deepEqual(titles(['--view', 'quests.open', '--tag', 'urgent']), ['Both']);
		assert.deepEqual(titles(['--tag', 'missing']), []);
		assert.equal(titles(['--tag', 'work', '--limit', '1']).length, 1);
		const limited = run(['list', '--tag', 'urgent', '--limit', '1']);
		assert.equal(limited.status, 0, limited.stderr);
		assert.match(limited.stdout, /Both/);
		assert.doesNotMatch(limited.stdout, /First|Other/);
		const capped = run(['list', '--tag', 'work', '--limit', '1']);
		assert.equal(capped.status, 0, capped.stderr);
		assert.equal((capped.stdout.match(/First|Both/g) ?? []).length, 1);
		assert.doesNotMatch(capped.stdout, /Other/);
		for (const view of ['rumors', 'questlines', 'deliveries', 'repeatables.due_anchors']) {
			const result = run(['list', '--view', view, '--tag', 'work']);
			assert.equal(result.status, 2);
			assert.match(result.stderr, /--tag requires a quest view/);
		}
		assert.match(run(['list', '--help']).stdout, /Require every tag.*AND/);
		const invalidDir = join(db, 'nested');
		const invalid = capture([
			'--experimental-strip-types',
			'src/cli.ts',
			'--db',
			join(invalidDir, 'work.db'),
			'list',
		]);
		assert.equal(invalid.status, 2);
		assert.equal(
			invalid.stderr,
			`Cannot create database directory ${invalidDir}: a path component is not a directory\n`,
		);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('help after positionals at one and two levels never opens a database', () => {
	for (const command of [
		['add', 'x'],
		['hook', 'remove', '3'],
	]) {
		for (const flag of ['--help', '-h']) {
			const result = capture(['src/cli.ts', '--db', '/unavailable/help.db', ...command, flag]);
			assert.equal(result.status, 0, result.stderr);
			assert.match(result.stdout, command[0] === 'hook' ? /questlog hook.*remove/s : /Usage:/);
			assert.equal(result.stderr, '');
		}
	}
});

test('literal search, raw FTS and start work through the CLI', () => {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-search-'));
	try {
		const db = join(dir, 'work.db');
		const run = (...args: string[]) => capture(['src/cli.ts', '--db', db, ...args]);
		for (const title of [
			'instagram-desk: note',
			'agentpreneur: German WoW price visible',
			'-leading',
			'alpha',
			'beta',
		]) {
			const added = run('add', '--', title);
			assert.equal(added.status, 0, added.stderr);
		}
		for (const query of [
			'instagram-desk:',
			'agentpreneur: German WoW price visible',
			'"agentpreneur:"',
			'German WoW',
			'-leading',
		]) {
			const result = run('search', '--json', '--', query);
			assert.equal(result.status, 0, result.stderr);
			assert.equal(JSON.parse(result.stdout).data.returnedCount, 1);
		}
		const raw = run('search', 'alpha OR beta', '--fts', '--json');
		assert.equal(raw.status, 0, raw.stderr);
		assert.equal(JSON.parse(raw.stdout).data.returnedCount, 2);
		const invalid = run('search', 'desk:', '--fts');
		assert.equal(invalid.status, 2);
		assert.match(invalid.stdout + invalid.stderr, /Invalid FTS query: "desk:"/);
		const started = run('start', '1');
		assert.equal(started.status, 0, started.stderr);
		assert.match(started.stdout, /id 1/);
		assert.equal(
			JSON.parse(run('show', '1', '--json').stdout).data.item.detail.state,
			'in_progress',
		);
		assert.equal(run('start', '999').status, 3);
		assert.match(run('--help').stdout, /start/);
		assert.deepEqual(
			questlogPlainCommands()
				.find((c) => c.spec.command === 'start')
				?.input({ id: 1, force: true }),
			{ action: 'start', questId: 1, force: true },
		);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('list pagination bounds text and JSON after filtering', () => {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-page-'));
	try {
		const db = join(dir, 'work.db');
		const run = (args: string[], env = process.env) =>
			capture(['src/cli.ts', '--db', db, ...args], env);
		for (const title of ['One', 'Two', 'Three']) assert.equal(run(['add', title]).status, 0);
		const full = JSON.parse(run(['list', '--json']).stdout).data.items;
		for (const envJson of [false, true]) {
			const result = run(
				['list', '--limit', '1', '--offset', '1', ...(envJson ? [] : ['--json'])],
				{ ...process.env, GHOSTPAW_OUTPUT: envJson ? 'json' : '' },
			);
			assert.equal(result.status, 0, result.stderr);
			const data = JSON.parse(result.stdout).data;
			assert.deepEqual(data.items, full.slice(1, 2));
			assert.deepEqual([data.total, data.offset, data.limit, data.hasMore], [3, 1, 1, true]);
		}
		const text = run(['list', '--limit', '1', '--offset', '1']);
		assert.match(text.stdout, new RegExp(full[1].title));
		assert.equal(text.stdout.trim().split('\n').length, 1);
		const end = JSON.parse(run(['list', '--json', '--offset', '3']).stdout).data;
		assert.deepEqual(end.items, []);
		assert.equal(end.hasMore, false);
		assert.equal(run(['list', '--offset', '-1']).status, 2);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('default database notice uses stderr and respects explicit selection and quiet', () => {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-notice-'));
	try {
		const env = {
			...process.env,
			HOME: dir,
			GHOSTPAW_QUESTLOG_DB: '',
			GHOSTPAW_QUIET: '',
			GHOSTPAW_OUTPUT: '',
		};
		const run = (args: string[], overrides = {}) =>
			capture(['src/cli.ts', ...args], { ...env, ...overrides });
		const db = join(dir, '.ghostpaw', 'questlog.db');
		run(['list']);
		const normal = run(['list']);
		assert.equal(normal.stderr, `using default db ${db}\n`);
		for (const quiet of [run(['list', '--quiet']), run(['list'], { GHOSTPAW_QUIET: '1' })]) {
			assert.equal(quiet.stdout, normal.stdout);
			assert.equal(quiet.stderr, '');
		}
		assert.equal(run(['list', '--db', db]).stderr, '');
		assert.equal(run(['list'], { GHOSTPAW_QUESTLOG_DB: db }).stderr, '');
		for (const args of [
			['help'],
			['--version'],
			['tools'],
			['describe', 'review_questlog'],
			['skill'],
			['list', '--help'],
			['hook', '--help'],
		])
			assert.equal(run(args).stderr, '');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
