import { minimalInput } from './schema_examples.ts';
import { schemaRows } from './schema_rows.ts';
import type { SurfaceTool } from './surface_types.ts';

export interface SkillMarkdownSpec<TCtx> {
	cheatSheet?: string;
	name: string;
	description: string;
	license?: string;
	compatibility?: string;
	metadata?: Record<string, string>;
	bin: string;
	packageName?: string;
	server: string;
	about: string;
	tools: readonly SurfaceTool<TCtx>[];
	workflows: readonly { name: string; description: string }[];
	principles: readonly string[];
}
export function renderSkillMarkdown<TCtx>(
	spec: SkillMarkdownSpec<TCtx>,
	{ referencesBase: _referencesBase = 'references' }: { referencesBase?: string } = {},
): string {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.name) || spec.name.length > 64)
		throw new Error('Invalid skill name');
	if (
		!spec.description.trim() ||
		spec.description.length > 1024 ||
		!spec.description.includes('Use when')
	)
		throw new Error('Invalid skill description');
	if (spec.compatibility && spec.compatibility.length > 500)
		throw new Error('Invalid compatibility');
	const lines = ['---', `name: ${spec.name}`, `description: ${JSON.stringify(spec.description)}`];
	for (const key of ['license', 'compatibility'] as const)
		if (spec[key]) lines.push(`${key}: ${JSON.stringify(spec[key])}`);
	if (spec.metadata) {
		lines.push('metadata:');
		for (const key of Object.keys(spec.metadata).sort())
			lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(spec.metadata[key])}`);
	}
	lines.push(
		'---',
		'',
		`# ${spec.name}`,
		'',
		spec.about,
		'',
		'## Calling tools',
		'',
		`MCP: connect to ${spec.server}, then call a tool by name with its JSON arguments.`,
		'',
		`CLI: \`${spec.bin} call <tool> '<JSON object>'\` or \`${spec.bin} <tool> --parameter value\`.`,
		'',
		`Inspect schemas with \`${spec.bin} describe <tool>\`. Use \`--db <path>\` to select a database.`,
		'',
	);
	for (const tool of spec.tools) {
		lines.push(
			`## ${tool.name}`,
			'',
			tool.description,
			'',
			`Use when: ${tool.whenToUse ?? ''}`,
			'',
			`Not for: ${tool.whenNotToUse ?? ''}`,
			'',
			tool.readOnly ? 'Read-only.' : `Writes: ${tool.sideEffects ?? 'state'}.`,
			'',
			'| Parameter | Type | Required | Values / description |',
			'| --- | --- | --- | --- |',
		);
		lines.push(...schemaRows(tool.inputSchema).map((row) => `| ${row} |`));
		lines.push('', '```sh');
		for (const action of tool.inputSchema.properties?.action?.enum?.slice(0, 3) ?? [undefined]) {
			lines.push(
				`${spec.bin} call ${tool.name} '${JSON.stringify(minimalInput(tool.inputSchema, action))}'`,
			);
		}
		lines.push('```');
		lines.push('');
	}
	lines.push(
		'## Workflow guides',
		'',
		...spec.workflows.map(
			(workflow) => `- \`${spec.bin} skill ${workflow.name}\`: ${workflow.description}`,
		),
		'',
		'## Principles',
		'',
		...spec.principles.map((principle) => `- ${principle}`),
		'',
	);
	const output = lines.join('\n');
	const fallback = spec.packageName
		? `
## Without the binary

Use \`npx -y ${spec.packageName} ...\` in npm-based environments (Node 24+). Harnesses that embed it in code can import \`${spec.packageName}\` as a library.
`
		: '';
	if (!spec.cheatSheet) return output + fallback;
	const title = `# ${spec.name}\n\n`;
	const start = output.indexOf(title) + title.length;
	return `${output.slice(0, start)}${spec.cheatSheet}\n\n## Appendix: MCP and tool calls\n\n${output.slice(start).replace(/^## /gm, '### ')}${fallback}`;
}
