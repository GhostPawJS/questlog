import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cliVersion } from '../cli_version.ts';
import type { QuestlogDb } from '../database.ts';
import { listDeliveries } from '../hooks/list_deliveries.ts';
import { listHooks } from '../hooks/list_hooks.ts';
import { questlogSkills } from '../skills/skill_registry.ts';
import type { ToolCliOptions } from '../surfaces/cli.ts';
import { cliCommandsHelp } from '../surfaces/cli_commands_help.ts';
import { renderSkillMarkdown } from '../surfaces/skill_markdown.ts';
import { textOutput } from '../surfaces/text_output.ts';
import { questlogVersion } from '../version.ts';
import { openQuestlogDb } from './open_questlog_db.ts';
import { questlogPlainCommands } from './questlog_plain_commands.ts';
import { questlogSurfaceTools } from './questlog_surface_tools.ts';
import { resolveQuestlogDbPath } from './resolve_questlog_db_path.ts';
import { runHookCommand } from './run_hook_command.ts';
import { serveQuestlogMcp } from './serve_questlog_mcp.ts';

function selectedDbPath(options: { db?: string }): string {
	const selected = resolveQuestlogDbPath(options.db === undefined ? {} : { flag: options.db });
	return selected === ':memory:' ? selected : resolve(selected);
}

function notice(options: {
	db?: string;
	quiet?: boolean;
	stderr?: import('node:stream').Writable;
}): void {
	if (options.db === undefined && !process.env.GHOSTPAW_QUESTLOG_DB && !options.quiet)
		(options.stderr ?? process.stderr).write(`using default db ${selectedDbPath(options)}\n`);
}

async function openContext(options: Parameters<typeof notice>[0]): Promise<QuestlogDb> {
	notice(options);
	return openQuestlogDb(selectedDbPath(options));
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
		const path = selectedDbPath(options);
		const created = path !== ':memory:' && !existsSync(path);
		notice(options);
		const db = await openQuestlogDb(path);
		if (created) process.stderr.write(`created ${path}\n`);
		return db;
	},
	closeContext: (db) => db.close(),
	commands: {
		aliases: { 'quest abandon': 'drop' },
		help: `Core flow:
  add "<title>" --due tomorrow --tag work --tag review
  list
  start <id>
  done <id> --outcome text
  due
  drop <id> [--reason text] (alias: quest abandon)
More: show, search, quest revise <id> --title text, review
Advanced:
  repeatable, hook, watch, tick
  Rumors: shape_work, show rumor:1, list --view rumors.open
  Unlocks: organize_work; rewards: reward_work
  ${cliCommandsHelp}
Use <command> --help.`,
		names: ['hook', 'watch'],
		run: async (command, args, options, io) => {
			if (command === 'quest' && args[0] && !['revise', '--help', '-h'].includes(args[0])) {
				io.stderr.write(
					`Unknown quest action: ${args[0]}. Available quest actions: revise, abandon. Create with questlog add "<title>" --tag x.\n`,
				);
				return 2;
			}
			if (command === 'show' && args[0]?.startsWith('d_')) {
				if (args.includes('--help') || args.includes('-h')) {
					io.stdout.write('questlog show <delivery-id> [--json]\n');
					return 0;
				}
				const db = await openContext(options);
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
			return runHookCommand(command, args, io, () => openContext(options));
		},
		plain: questlogPlainCommands(),
		guides: questlogSkills,
		mcp: async (options) => {
			notice(options);
			await serveQuestlogMcp(options.db === undefined ? {} : { dbPath: options.db });
		},
		skill: async () => {
			const { questlogSkillSpec } = await import('./questlog_skill_spec.ts');
			return renderSkillMarkdown(questlogSkillSpec);
		},
	},
};
