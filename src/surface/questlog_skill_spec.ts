import { questlogSkills } from '../skills/skill_registry.ts';
import { questlogSoulTraits } from '../soul.ts';
import { reviewQuestlogTool } from '../tools/review_questlog_tool.ts';
import { questlogMcpInstructions } from './questlog_mcp_instructions.ts';
import { questlogSurfaceTools } from './questlog_surface_tools.ts';

export const questlogSkillSpec = {
	name: 'questlog',
	cheatSheet: [
		'`questlog` and `ghostpaw-questlog` are the same binary.',
		'',
		'- `questlog add --title "..." --tag a,b --due tomorrow`',
		`- \`questlog list [--view <view>]\`: ${reviewQuestlogTool.inputSchema.properties?.view?.enum?.join(', ')}.`,
		'- `questlog done <id> --outcome "..."`',
		'- `questlog search <words>`',
		'- `questlog show <id>`',
		'- Use `--json` on any plain command.',
		'- Exit codes: 0 ok / 1 error / 2 usage / 3 needs input.',
		'- Database: `~/.ghostpaw/questlog.db`; override with `--db` or `GHOSTPAW_QUESTLOG_DB`.',
		'- Use one database per agent or project.',
	].join('\n'),
	description:
		'Manage local tasks, calendar commitments, and recurring work. Use when planning, executing, reviewing, or organizing work.',
	license: 'MIT',
	compatibility: 'Node.js 24 or newer. MCP stdio or ghostpaw-questlog CLI.',
	bin: 'ghostpaw-questlog',
	packageName: '@ghostpaw/questlog',
	server: 'ghostpaw-questlog',
	about: questlogMcpInstructions,
	tools: questlogSurfaceTools,
	workflows: questlogSkills,
	principles: questlogSoulTraits.map((trait) => trait.principle),
};
