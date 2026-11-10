import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { questlogPlainCommands } from '../surface/questlog_plain_commands.ts';
import { questlogSurfaceTools } from '../surface/questlog_surface_tools.ts';
import { runToolCli } from '../surfaces/cli.ts';
import { organizeWorkTool } from './organize_work_tool.ts';
import { planQuestTool } from './plan_quest_tool.ts';
import { shapeWorkTool, shapeWorkToolHandler } from './shape_work_tool.ts';

test('facade creates, plans, and settles nested calendar inputs with actionable typed errors', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		const now = Date.parse('2026-11-10T00:30:00Z');
		const created = shapeWorkTool.handler(db, {
			action: 'create_quest',
			now,
			tz: 'UTC',
			quest: {
				title: 'Calendar',
				objective: 'Check timing',
				dueAt: 'tomorrow',
				scheduledStartAt: '+1h',
				scheduledEndAt: '+2h',
			},
		});
		assert.equal(created.ok, true);
		if (!created.ok) throw new Error('expected success');
		const quest = created.data.quest;
		assert.ok(quest);
		assert.equal(quest.dueAt, Date.parse('2026-11-11T23:59:59.999Z'));
		assert.equal(quest.scheduledStartAt, now + 3600000);
		assert.equal(quest.scheduledEndAt, now + 7200000);
		const planned = planQuestTool.handler(db, {
			action: 'set_time',
			questId: quest.id,
			dueAt: '2026-11-12',
			scheduledStartAt: '2026-11-12T09:00:00Z',
			scheduledEndAt: '2026-11-12T10:00:00Z',
		});
		assert.equal(planned.ok, true);
		if (planned.ok) assert.equal(planned.data.quest.dueAt, Date.parse('2026-11-12T23:59:59.999Z'));
		for (const field of ['dueAt', 'scheduledStartAt', 'scheduledEndAt']) {
			const refused = shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: { title: 'Invalid', objective: 'Seconds', [field]: 1794268800 },
			});
			assert.equal(refused.ok, false);
			if (!refused.ok && 'error' in refused) {
				assert.equal(refused.error.code, 'invalid_input');
				assert.match(refused.error.message, /epoch milliseconds.*not seconds/);
				assert.match(refused.error.message, /"quest":\{"title":"string","createdAt"/);
				assert.match(refused.error.message, /scheduledEndAt/);
			}
		}
		const direct = shapeWorkToolHandler(db, {
			action: 'create_quest',
			quest: { title: 'Historical', objective: 'ISO before 2001', dueAt: '1970-01-01T00:00:01Z' },
		});
		assert.equal(direct.ok, true);
		const line = shapeWorkTool.handler(db, {
			action: 'create_questline',
			questline: { title: 'Line' },
		});
		assert.equal(line.ok, true);
		if (line.ok) {
			assert.ok(line.data.questline);
			assert.equal(
				organizeWorkTool.handler(db, {
					action: 'set_questline_fields',
					questlineId: line.data.questline.id,
					dueAt: '2026-11-12',
				}).ok,
				true,
			);
		}
		const missing = shapeWorkTool.handler(db, { action: 'create_quest' } as never);
		assert.equal(missing.ok, false);
		if (!missing.ok && 'error' in missing) {
			assert.match(missing.error.message, /"quest":\{"title":"string"/);
			assert.match(missing.error.message, /"objective":"string"/);
			assert.match(missing.error.message, /dueAt.*epoch ms/);
		}
	} finally {
		db.close();
	}
});

test('CLI JSON calls and add accept dates and zones and reject seconds', async () => {
	const db = await createInitializedQuestlogDb();
	const invoke = async (args: string[]) => {
		let out = '';
		let err = '';
		const sink = (append: (s: string) => void) =>
			new Writable({
				write(chunk, _encoding, done) {
					append(String(chunk));
					done();
				},
			});
		const code = await runToolCli(args, {
			bin: 'questlog',
			version: '1',
			description: '',
			tools: questlogSurfaceTools,
			commands: { plain: questlogPlainCommands() },
			openContext: () => db,
			stdout: sink((s) => {
				out += s;
			}),
			stderr: sink((s) => {
				err += s;
			}),
		});
		return { code, out, err };
	};
	try {
		const called = await invoke([
			'call',
			'shape_work',
			JSON.stringify({
				action: 'create_quest',
				tz: 'Europe/Berlin',
				quest: {
					title: 'CLI',
					objective: 'Calendar',
					dueAt: '2026-11-12',
					scheduledStartAt: '2026-11-12T09:00:00Z',
					scheduledEndAt: '2026-11-12T10:00:00Z',
				},
			}),
		]);
		assert.equal(called.code, 0, called.err);
		assert.equal(JSON.parse(called.out).data.quest.dueAt, Date.parse('2026-11-12T23:59:59.999Z'));
		const added = await invoke([
			'add',
			'Relative',
			'--due',
			'+2h',
			'--tz',
			'Europe/Berlin',
			'--json',
		]);
		assert.equal(added.code, 0, added.err);
		assert.ok(Math.abs(JSON.parse(added.out).data.quest.dueAt - Date.now() - 7200000) < 1000);
		for (const args of [
			['add', 'Seconds', '--due', '1794268800'],
			[
				'call',
				'shape_work',
				'{"action":"create_quest","quest":{"title":"Seconds","objective":"Invalid","dueAt":1794268800}}',
			],
		]) {
			const refused = await invoke(args);
			assert.equal(refused.code, 2);
			assert.match(refused.err + refused.out, /epoch milliseconds.*not seconds/);
		}
	} finally {
		db.close();
	}
});
