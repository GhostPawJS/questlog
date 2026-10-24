import { readFileSync } from 'node:fs';
import { questlogSkills } from '../../src/skills/skill_registry.ts';
import { questlogSkillSpec } from '../../src/surface/questlog_skill_spec.ts';
import { questlogSurfaceTools } from '../../src/surface/questlog_surface_tools.ts';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
export const config = {
	slug: 'questlog',
	skill: questlogSkillSpec,
	workflows: questlogSkills,
	manifest: {
		name: 'ghostpaw-questlog',
		version: pkg.version,
		description: 'Local tasks, calendar commitments, and recurring work.',
		author: pkg.author,
		homepage: pkg.homepage,
		repository: pkg.repository.url,
		license: pkg.license,
		keywords: pkg.keywords,
		server: 'ghostpaw-questlog',
		packageName: pkg.name,
		mcpName: 'io.github.GhostPawJS/questlog',
		title: 'GhostPaw Questlog',
		websiteUrl: pkg.homepage,
		environment: [
			{
				name: 'GHOSTPAW_QUESTLOG_DB',
				description: 'SQLite database path (default: ~/.ghostpaw/questlog.db)',
			},
		],
	},
};

export const mcpbSpec = {
	...config.manifest,
	longDescription:
		'Local tasks, calendar commitments, and recurring work. Stores data in a local SQLite database.',
	documentation: 'https://github.com/GhostPawJS/questlog/blob/main/README.md',
	support: pkg.bugs.url,
	entryPoint: 'server/mcp-server.js',
	env: { GHOSTPAW_QUESTLOG_DB: `\${user_config.db_path}` },
	userConfig: {
		db_path: {
			type: 'string',
			title: 'Database path',
			description: 'Path to the local SQLite database.',
			required: false,
			default: `\${HOME}/.ghostpaw/questlog.db`,
		},
	},
	tools: questlogSurfaceTools.map(({ name, description }) => ({ name, description })),
};
