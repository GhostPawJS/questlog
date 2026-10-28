import { questlogSkills } from '../skills/skill_registry.ts';
import { questlogSoulTraits } from '../soul.ts';
import { reviewQuestlogTool } from '../tools/review_questlog_tool.ts';
import { questlogMcpInstructions } from './questlog_mcp_instructions.ts';
import { questlogSurfaceTools } from './questlog_surface_tools.ts';

export const questlogSkillSpec = {
	name: 'questlog',
	cheatSheet: [
		'## Install',
		'',
		'Linux/macOS:',
		'',
		'```sh',
		'curl -fsSL https://raw.githubusercontent.com/GhostPawJS/questlog/main/install.sh | sh',
		'```',
		'',
		'Installs `~/.local/bin/ghostpaw-questlog` after checking SHA256SUMS.',
		'',
		'Windows x64 (PowerShell):',
		'',
		'```powershell',
		'irm https://raw.githubusercontent.com/GhostPawJS/questlog/main/install.ps1 | iex',
		'```',
		'',
		'Run tools as `ghostpaw-questlog ...`; use `~/.local/bin/ghostpaw-questlog` if it is not on PATH.',
		'',
		'`questlog` and `ghostpaw-questlog` are the same binary.',
		'',
		'- `questlog search <words>` before `add` to avoid duplicates.',
		'- `ghostpaw-questlog add "Write the report" --tag work --due tomorrow`',
		`- \`questlog list [--view <view>]\`: ${reviewQuestlogTool.inputSchema.properties?.view?.enum?.join(', ')}.`,
		'- `questlog done 12 --outcome "Report sent"`',
		'- `questlog search "release"`',
		'- `questlog show 12`',
		'- `questlog list --view quests.available`',
		'- Use `--json` on any plain command.',
		'- Exit codes: 0 ok / 1 error / 2 usage / 3 needs input or hook target not found.',
		'- Database: `~/.ghostpaw/questlog.db`; override with `--db` or `GHOSTPAW_QUESTLOG_DB`.',
		'- Use one database per project.',
		'- `questlog --version` prints the installed version.',
		'- `questlog skill --short` prints this compact cheat sheet.',
		'- `questlog skill --list` lists guides; `questlog skill webhooks` reads one.',
		'- Webhooks: `questlog hook add <url>`, `questlog tick --dry-run`, `questlog watch`. Read `questlog skill webhooks` for events, signing, verification, and cron setup.',
	].join('\n'),
	description:
		'Use the release binary ghostpaw-questlog to manage local tasks, calendar commitments, and recurring work. Use when planning, executing, reviewing, or organizing work.',
	license: 'MIT',
	compatibility:
		'Release binary ghostpaw-questlog (no runtime needed); MCP stdio via ghostpaw-questlog mcp.',
	bin: 'ghostpaw-questlog',
	packageName: '@ghostpaw/questlog',
	server: 'ghostpaw-questlog',
	about: questlogMcpInstructions,
	tools: questlogSurfaceTools,
	workflows: questlogSkills,
	principles: questlogSoulTraits.map((trait) => trait.principle),
};
