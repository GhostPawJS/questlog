import type { QuestlogDb } from '../database.ts';
import type { ToolCliOptions } from '../surfaces/cli.ts';
import { questlogVersion } from '../version.ts';
import { questlogPlainCommands } from './questlog_plain_commands.ts';
import { questlogSurfaceTools } from './questlog_surface_tools.ts';

export const questlogCliOptions: ToolCliOptions<QuestlogDb> = {
	bin: 'ghostpaw-questlog',
	version: questlogVersion,
	description: 'Local task and calendar library',
	tools: questlogSurfaceTools,
	openContext: async (options) => {
		const { openQuestlogDb } = await import('./open_questlog_db.ts');
		const { resolveQuestlogDbPath } = await import('./resolve_questlog_db_path.ts');
		return openQuestlogDb(
			resolveQuestlogDbPath(options.db === undefined ? {} : { flag: options.db }),
		);
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
