import { questlogSkills } from '../skills/skill_registry.ts';
import { questlogSoulTraits } from '../soul.ts';
import { questlogMcpInstructions } from './questlog_mcp_instructions.ts';
import { questlogSurfaceTools } from './questlog_surface_tools.ts';

export const questlogSkillSpec = {
	name: 'questlog',
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
