import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuestline } from '../questlines/create_questline.ts';
import { createQuest } from '../quests/create_quest.ts';
import { createRepeatableQuest } from '../repeatable_quests/create_repeatable_quest.ts';
import { captureRumor } from '../rumors/capture_rumor.ts';
import { runToolCli } from '../surfaces/cli.ts';
import { manageRepeatableTool } from '../tools/manage_repeatable_tool.ts';
import { runQuestTool } from '../tools/run_quest_tool.ts';
import { shapeWorkTool } from '../tools/shape_work_tool.ts';
import { expectSuccess } from '../tools/tool_test_utils.ts';
import { questlogCliOptions } from './questlog_cli_options.ts';
import { questlogPlainCommands } from './questlog_plain_commands.ts';
import { questlogSurfaceTools } from './questlog_surface_tools.ts';

const t0 = Date.parse('2026-10-01T00:00:00Z');
const t1 = Date.parse('2026-10-02T00:00:00Z');
const t2 = Date.parse('2026-10-05T00:00:00Z');

async function fixture() {
	const db = await createInitializedQuestlogDb();
	const quiet: boolean[] = [];
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
				quiet.push(Boolean(opts.quiet));
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
	return { db, quiet, invoke };
}

test('historical lifecycle survives CLI show/list and tool timestamps', async () => {
	const { db, invoke } = await fixture();
	try {
		const added = await invoke([
			'add',
			'Past work',
			'--created-at',
			'2026-10-01T00:00:00Z',
			'--tag',
			'history',
			'--json',
		]);
		assert.equal(added.code, 0, added.err);
		const id = JSON.parse(added.out).data.quest.id;
		assert.equal((await invoke(['start', String(id), '--at', '2026-10-02T00:00:00Z'])).code, 0);
		assert.equal(
			(await invoke(['done', String(id), '--at', String(t2), '--outcome', 'Completed'])).code,
			0,
		);
		const detail = JSON.parse((await invoke(['show', `quest:${id}`, '--json'])).out).data.item
			.detail;
		assert.deepEqual([detail.createdAt, detail.startedAt, detail.resolvedAt], [t0, t1, t2]);
		assert.equal(detail.createdAtIso, '2026-10-01T00:00:00.000Z');
		const listed = JSON.parse((await invoke(['list', '--view', 'quests.resolved', '--json'])).out)
			.data.items;
		assert.equal(listed[0].resolvedAt, t2);
		assert.match((await invoke(['show', String(id)])).out, /created[\s\S]*started[\s\S]*finished/);
		const quest = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				now: t0,
				quest: { title: 'Tool history', objective: 'History' },
			}),
		).data.quest;
		assert.ok(quest);
		assert.equal(quest.createdAt, t0);
		assert.equal(
			expectSuccess(runQuestTool.handler(db, { action: 'start', questId: quest.id, now: t1 })).data
				.quest.startedAt,
			t1,
		);
		assert.equal(
			expectSuccess(
				runQuestTool.handler(db, { action: 'finish', questId: quest.id, outcome: 'Done', now: t2 }),
			).data.quest.resolvedAt,
			t2,
		);
		const explicit = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				now: t1,
				quest: { title: 'Explicit', objective: 'Precedence', createdAt: t0 },
			}),
		).data.quest;
		assert.equal(explicit?.createdAt, t0);
		const nested = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				now: t1,
				quest: { title: 'Nested', objective: 'Precedence', now: t0 },
			}),
		).data.quest;
		assert.equal(nested?.createdAt, t0);
		assert.equal(
			expectSuccess(
				shapeWorkTool.handler(db, {
					action: 'create_questline',
					now: t0,
					questline: { title: 'Past group' },
				}),
			).data.questline?.createdAt,
			t0,
		);
		for (const createdAt of [t0 / 1000, t0 + 0.5, Number.NaN])
			assert.throws(
				() => createQuest(db, { title: 'Bad', objective: 'Bad', createdAt }),
				/integer.*milliseconds/,
			);
		for (const value of ['1727740800', 'nonsense'])
			assert.equal((await invoke(['add', 'Bad', '--created-at', value])).code, 2);
		assert.equal(
			createQuest(db, { title: 'Future', objective: 'Allowed', createdAt: t2 + 1e12 }).createdAt,
			t2 + 1e12,
		);
		const invalidOrder = createQuest(db, { title: 'Order', objective: 'Check', createdAt: t1 });
		assert.equal(
			runQuestTool.handler(db, { action: 'start', questId: invalidOrder.id, startedAt: t0 }).ok,
			false,
		);
	} finally {
		db.close();
	}
});

test('rumor settlement and dismissal honor now with explicit timestamps taking precedence', async () => {
	const { db } = await fixture();
	try {
		const rumor = captureRumor(db, { title: 'History', now: t0 });
		const settled = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'settle_rumor',
				rumorId: rumor.id,
				now: t1,
				quests: [{ title: 'Work', objective: 'Work' }],
			}),
		);
		assert.equal(settled.data.rumor?.settledAt, t1);
		assert.equal(settled.data.quests?.[0]?.createdAt, t1);
		const other = captureRumor(db, { title: 'Dismiss', now: t0 });
		assert.equal(
			expectSuccess(
				shapeWorkTool.handler(db, {
					action: 'dismiss_rumor',
					rumorId: other.id,
					now: t1,
					dismissedAt: t2,
				}),
			).data.rumor?.dismissedAt,
			t2,
		);
		const third = captureRumor(db, { title: 'Dismiss fallback', now: t0 });
		assert.equal(
			expectSuccess(
				shapeWorkTool.handler(db, { action: 'dismiss_rumor', rumorId: third.id, now: t1 }),
			).data.rumor?.dismissedAt,
			t1,
		);
	} finally {
		db.close();
	}
});

test('kind refs inspect every supported kind and errors name valid kinds', async () => {
	const { db, invoke } = await fixture();
	try {
		const quest = createQuest(db, { title: 'Quest', objective: 'Quest' });
		const rumor = captureRumor(db, { title: 'Rumor' });
		const questline = createQuestline(db, { title: 'Group' });
		const repeatable = createRepeatableQuest(db, {
			title: 'Daily',
			objective: 'Daily',
			rrule: 'FREQ=DAILY',
			anchorAt: t0,
		});
		for (const [kind, id] of [
			['quest', quest.id],
			['rumor', rumor.id],
			['questline', questline.id],
			['repeatable_quest', repeatable.id],
			['repeatable', repeatable.id],
		] as const) {
			const result = await invoke(['show', `${kind}:${id}`, '--json']);
			assert.equal(result.code, 0, result.err);
			assert.equal(
				JSON.parse(result.out).data.item.kind,
				kind === 'repeatable' ? 'repeatable_quest' : kind,
			);
		}
		assert.equal((await invoke(['show', String(quest.id)])).code, 0);
		const bad = await invoke(['show', 'unknown:1']);
		assert.equal(bad.code, 2);
		assert.match(bad.err, /quest, questline, repeatable_quest, rumor.*inspect_questlog_item/);
		for (const ref of ['rumor:x', 'rumor:1:2']) assert.equal((await invoke(['show', ref])).code, 2);
	} finally {
		db.close();
	}
});

test('quiet aliases, filtered totals, usage guidance and rumor view help', async () => {
	const { db, invoke, quiet } = await fixture();
	try {
		createQuest(db, { title: 'One', objective: 'One', tags: ['work'] });
		createQuest(db, { title: 'Two', objective: 'Two', tags: ['work', 'review'] });
		createQuest(db, { title: 'Three', objective: 'Three' });
		for (const args of [
			['-q', 'list'],
			['list', '-q'],
			['list', '--quiet'],
		])
			assert.equal((await invoke(args)).code, 0);
		assert.deepEqual(quiet, [true, true, true]);
		assert.equal((await invoke(['list', '--count'])).out, '3\n');
		assert.equal(
			(await invoke(['list', '--count', '--tag', 'work', '--limit', '1', '--offset', '1'])).out,
			'2\n',
		);
		assert.deepEqual(
			JSON.parse(
				(await invoke(['list', '--count', '--tag', 'work', '--tag', 'review', '--json'])).out,
			),
			{ total: 1 },
		);
		assert.equal((await invoke(['list', '--count', '--tag', 'absent'])).out, '0\n');
		assert.equal((await invoke(['list', '--count', '--count-by', 'tag'])).code, 2);
		captureRumor(db, { title: 'Open intake' });
		assert.equal(
			(await invoke(['list', '--view', 'rumors.open'])).out,
			(await invoke(['list', '--view', 'rumors'])).out,
		);
		assert.equal((await invoke(['list', '--view', 'rumors.open', '--count'])).out, '1\n');
		const badView = await invoke(['list', '--view', 'bad']);
		assert.equal(badView.code, 2);
		assert.match(badView.err, /quests.available.*rumors/);
		const missing = await invoke(['done', '1']);
		assert.equal(missing.code, 2);
		assert.match(missing.err, /--outcome '\.\.\.'/);
		assert.equal((await invoke(['done', '99999'])).code, 2);
		assert.match((await invoke(['add', '--help'])).out, /--due tomorrow --tag work --tag review/);
		assert.match((await invoke(['list', '--help'])).out, /-q, --quiet/);
		assert.match((await invoke(['show', '--help'])).out, /show rumor:1/);
		assert.match((await invoke(['list', '--help'])).out, /rumors.open/);
	} finally {
		db.close();
	}
});

test('spawn_due defaults to current time and invalid call results exit 2 with nested examples', async () => {
	const { db, invoke } = await fixture();
	try {
		assert.equal(manageRepeatableTool.handler(db, { action: 'spawn_due' }).outcome, 'no_op');
		createRepeatableQuest(db, {
			title: 'Due',
			objective: 'Due',
			rrule: 'FREQ=DAILY;COUNT=1',
			anchorAt: t0,
			now: t0,
		});
		assert.equal(
			expectSuccess(manageRepeatableTool.handler(db, { action: 'spawn_due' })).data.spawnedQuests
				?.length,
			1,
		);
		for (const [tool, input, nested] of [
			['shape_work', { action: 'create_quest', title: 'Flat', objective: 'Flat' }, 'quest'],
			['tag_work', { action: 'add', questId: 1, tagNames: ['work'] }, 'target'],
		] as const) {
			const result = await invoke(['call', tool, JSON.stringify(input)]);
			assert.equal(result.code, 2, result.err);
			const parsed = JSON.parse(result.out);
			assert.equal(parsed.error.code, 'invalid_input');
			assert.match(parsed.summary, new RegExp(`expected nested input shape:.*${nested}`));
		}
		const help = await invoke(['describe', 'shape_work']);
		assert.match(help.out, /dueAt[\s\S]*epoch milliseconds/);
		assert.match(shapeWorkTool.inputDescriptions.now ?? '', /epoch milliseconds/);
	} finally {
		db.close();
	}
});

test('root help documents due with tags and rumor inspection without opening a database', async () => {
	let output = '';
	const stdout = new Writable({
		write(chunk, _encoding, done) {
			output += String(chunk);
			done();
		},
	});
	const code = await runToolCli(['--help'], {
		...questlogCliOptions,
		stdout,
		openContext() {
			throw new Error('help must not open the database');
		},
	});
	assert.equal(code, 0);
	assert.match(output, /--due tomorrow --tag work --tag review/);
	assert.match(output, /show rumor:1/);
	assert.match(output, /rumors.open/);
	assert.match(output, /-q, --quiet/);
});
