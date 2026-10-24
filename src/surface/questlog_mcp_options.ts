import type { QuestlogDb } from '../database.ts';
import type { McpServerOptions } from '../surfaces/mcp_server.ts';
import { questlogVersion } from '../version.ts';
import { questlogMcpInstructions } from './questlog_mcp_instructions.ts';
import { questlogSurfaceTools } from './questlog_surface_tools.ts';

export function questlogMcpOptions(
	context: () => QuestlogDb | Promise<QuestlogDb>,
): McpServerOptions<QuestlogDb> {
	return {
		name: 'ghostpaw-questlog',
		version: questlogVersion,
		title: 'Questlog',
		instructions: questlogMcpInstructions,
		tools: questlogSurfaceTools,
		context,
		annotations: (tool) => ({
			readOnlyHint: tool.readOnly ?? false,
			destructiveHint: Boolean(
				tool.inputSchema.properties?.action?.enum?.some(
					(action) =>
						typeof action === 'string' &&
						/delete|retire|merge|trash|hide|remove|replace|archive|abandon|dismiss/.test(action),
				),
			),
			idempotentHint: tool.readOnly ?? false,
			openWorldHint: false,
		}),
	};
}
