import { questlogSurfaceTools } from './surface/questlog_surface_tools.ts';
import { runToolCli } from './surfaces/cli.ts';
import { questlogVersion } from './version.ts';

process.exitCode = await runToolCli(process.argv.slice(2), {
	bin: 'ghostpaw-questlog',
	version: questlogVersion,
	description: 'Local task and calendar library',
	tools: questlogSurfaceTools,
	openContext: async (options) => {
		const { openQuestlogDb } = await import('./surface/open_questlog_db.ts');
		const { resolveQuestlogDbPath } = await import('./surface/resolve_questlog_db_path.ts');
		return openQuestlogDb(
			resolveQuestlogDbPath(options.db === undefined ? {} : { flag: options.db }),
		);
	},
	closeContext: (db) => db.close(),
	commands: {
		mcp: async (options) => {
			const { serveQuestlogMcp } = await import('./surface/serve_questlog_mcp.ts');
			await serveQuestlogMcp(options.db === undefined ? {} : { dbPath: options.db });
		},
		skill: async () => {
			const { renderSkillMarkdown } = await import('./surfaces/skill_markdown.ts');
			const { questlogSkillSpec } = await import('./surface/questlog_skill_spec.ts');
			return renderSkillMarkdown(questlogSkillSpec);
		},
	},
});
