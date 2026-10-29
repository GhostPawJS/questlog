import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cliVersion } from '../cli_version.ts';
import type { QuestlogDb } from '../database.ts';
import { questlogSkills } from '../skills/skill_registry.ts';
import type { ToolCliOptions } from '../surfaces/cli.ts';
import { questlogVersion } from '../version.ts';
import { questlogPlainCommands } from './questlog_plain_commands.ts';
import { questlogSurfaceTools } from './questlog_surface_tools.ts';
import { resolveQuestlogDbPath } from './resolve_questlog_db_path.ts';

function selectedDbPath(options: { db?: string }): string {
	const selected = resolveQuestlogDbPath(options.db === undefined ? {} : { flag: options.db });
	return selected === ':memory:' ? selected : resolve(selected);
}

export const questlogCliOptions: ToolCliOptions<QuestlogDb> = {
	bin: 'ghostpaw-questlog',
	version: questlogVersion,
	versionLine: (args) => cliVersion(questlogVersion, { args }),
	description: 'Local task and calendar library',
	tools: questlogSurfaceTools,
	describeDb: (options) =>
		`Database: ${selectedDbPath(options)}\nUse --db <path> or GHOSTPAW_QUESTLOG_DB to override the default ~/.ghostpaw/questlog.db.`,
	openContext: async (options) => {
		const { openQuestlogDb } = await import('./open_questlog_db.ts');
		const path = selectedDbPath(options);
		const created = path !== ':memory:' && !existsSync(path);
		const db = await openQuestlogDb(path);
		if (created) process.stderr.write(`created ${path}\n`);
		return db;
	},
	closeContext: (db) => db.close(),
	commands: {
		names: ['hook', 'watch'],
		run: async (command, args, options, io) => {
			if (command === 'show' && args[0]?.startsWith('d_')) {
				const { listDeliveries } = await import('../hooks/list_deliveries.ts');
				const { listHooks } = await import('../hooks/list_hooks.ts');
				const { textOutput } = await import('../surfaces/text_output.ts');
				if (args.includes('--help') || args.includes('-h')) {
					io.stdout.write('questlog show <delivery-id> [--json]\n');
					return 0;
				}
				const { openQuestlogDb } = await import('./open_questlog_db.ts');
				const db = await openQuestlogDb(selectedDbPath(options));
				try {
					const delivery = listDeliveries(db, { includeDelivered: true }).find(
						(d) => d.id === args[0],
					);
					if (!delivery) {
						io.stderr.write(`Delivery ${args[0]} not found\n`);
						return 3;
					}
					const target = listHooks(db).find((h) => h.id === delivery.targetId);
					const result = {
						...delivery,
						target: target ?? null,
						eventIds: delivery.events.map((e) => e.id),
					};
					io.stdout.write(
						`${args.includes('--json') ? JSON.stringify(result, null, 2) : textOutput(result)}\n`,
					);
					return 0;
				} finally {
					db.close();
				}
			}
			if (command !== 'hook' && command !== 'watch') return undefined;
			const { runHookCommand } = await import('./run_hook_command.ts');
			return runHookCommand(command, args, io, async () => {
				const { openQuestlogDb } = await import('./open_questlog_db.ts');
				return openQuestlogDb(selectedDbPath(options));
			});
		},
		plain: questlogPlainCommands(),
		guides: questlogSkills,
		mcp: async (options) => {
			const { serveQuestlogMcp } = await import('./serve_questlog_mcp.ts');
			await serveQuestlogMcp(options.db === undefined ? {} : { dbPath: options.db });
		},
		skill: async () => {
			const { renderSkillMarkdown } = await import('../surfaces/skill_markdown.ts');
			const { questlogSkillSpec } = await import('./questlog_skill_spec.ts');
			return renderSkillMarkdown(questlogSkillSpec);
		},
	},
};
