import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { runToolCli } from '../surfaces/cli.ts';
import { questlogPlainCommands } from './questlog_plain_commands.ts';
import { questlogSurfaceTools } from './questlog_surface_tools.ts';

test('plain commands operate on real quests in text and JSON modes', async () => {
	const db = await createInitializedQuestlogDb();
	const paths: { db?: string }[] = [];
	const invoke = async (args: string[]) => {
		let out = '';
		let err = '';
		const stream = (write: (s: string) => void) =>
			new Writable({
				write(chunk, _encoding, cb) {
					write(String(chunk));
					cb();
				},
			});
		const code = await runToolCli(args, {
			bin: 'questlog',
			version: '1',
			description: '',
			tools: questlogSurfaceTools,
			commands: { plain: questlogPlainCommands() },
			openContext: (opts) => {
				paths.push(opts);
				return db;
			},
			stdout: stream((s) => {
				out += s;
			}),
			stderr: stream((s) => {
				err += s;
			}),
		});
		return { code, out, err };
	};
	try {
		for (const json of [false, true]) {
			const flags = json ? ['--json'] : [];
			const added = await invoke([
				'add',
				'--title',
				'Release notes',
				'--tag',
				'release',
				'--tag',
				'docs',
				'--due',
				'2030-01-02',
				'--db',
				':memory:',
				...flags,
			]);
			assert.equal(added.code, 0, added.err);
			const id = json
				? JSON.parse(added.out).data.primary.id
				: Number(added.out.match(/id (\d+)/)?.[1]);
			assert.ok(id);
			if (json) {
				const detail = JSON.parse(added.out).data.quest;
				assert.equal(detail.objective, 'Release notes');
				assert.equal(detail.dueAt, Date.parse('2030-01-02'));
				assert.deepEqual(detail.tagNames, ['docs', 'release']);
			} else assert.match(added.out, /Created quest/);
			for (const args of [
				['list', '--limit', '1'],
				['search', 'Release', 'notes', '--limit', '1'],
				['show', String(id)],
			]) {
				const result = await invoke([...args, ...flags]);
				assert.equal(result.code, 0, result.err);
				if (json) assert.equal(JSON.parse(result.out).ok, true);
				else {
					assert.match(result.out, /Release notes/);
					assert.match(result.out, /#release/);
					assert.equal(result.out.trim().split('\n').length, 1);
				}
			}
			const missing = await invoke(['done', String(id), ...flags]);
			assert.equal(missing.code, 2);
			assert.match(missing.err, /Missing required argument: outcome/);
			const done = await invoke(['done', String(id), '--outcome', 'Reviewed', ...flags]);
			assert.equal(done.code, 0, done.err);
			if (json) assert.equal(JSON.parse(done.out).data.quest.outcome, 'Reviewed');
			else assert.match(done.out, new RegExp(`id ${id}`));
		}
		for (const command of ['add', 'list', 'done', 'search', 'show']) {
			const count = paths.length;
			assert.match((await invoke([command, '--help'])).out, /Usage:/);
			assert.equal(paths.length, count);
			assert.equal((await invoke([command, '--unknown'])).code, 2);
		}
		assert.match((await invoke(['--help'])).out, /add, list, done, search, show/);
		assert.equal((await invoke(['list', '--view', 'quests.scheduled_for_day'])).code, 3);
		assert.equal((await invoke(['list', '--view', 'bad'])).code, 2);
		for (const command of ['list', 'search']) {
			assert.equal(
				(await invoke([command, ...(command === 'search' ? ['Release'] : []), '--limit', '0']))
					.code,
				1,
			);
		}
		const questline = await invoke([
			'call',
			'shape_work',
			'{"action":"create_questline","questline":{"title":"Release"}}',
		]);
		const questlineId = JSON.parse(questline.out).data.primary.id;
		const attached = await invoke([
			'add',
			'--title',
			'Linked',
			'--questline',
			String(questlineId),
			'--json',
		]);
		assert.equal(JSON.parse(attached.out).data.quest.questlineId, questlineId);
		assert.equal((await invoke(['add', '--title', 'Invalid', '--due', 'bad'])).code, 1);
		assert.equal((await invoke(['show', '99999'])).code, 1);
		assert.equal(
			(
				await invoke([
					'add',
					'--title',
					'Explicit',
					'--objective',
					'Different',
					'--due',
					'1000',
					'--json',
					'--compact',
				])
			).out
				.trim()
				.split('\n').length,
			1,
		);
		for (const args of [
			['call', 'search_questlog', '{"query":"Release"}'],
			['search_questlog', '--query', 'Release'],
		]) {
			const result = await invoke(['--db', ':memory:', ...args]);
			assert.equal(result.code, 0);
			assert.equal(JSON.parse(result.out).ok, true);
		}
		assert.ok(paths.every((path) => path.db === undefined || path.db === ':memory:'));
	} finally {
		db.close();
	}
});
