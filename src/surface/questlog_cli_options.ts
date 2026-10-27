import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cliVersion } from '../cli_version.ts';
import type { QuestlogDb } from '../database.ts';
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
	versionLine: () => cliVersion(questlogVersion),
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
		plain: questlogPlainCommands(),
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
