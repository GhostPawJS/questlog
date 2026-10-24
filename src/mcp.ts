import type { QuestlogDb } from './database.ts';
import { openQuestlogDb } from './surface/open_questlog_db.ts';
import { questlogMcpOptions } from './surface/questlog_mcp_options.ts';
import { resolveQuestlogDbPath } from './surface/resolve_questlog_db_path.ts';
import { createMcpServer } from './surfaces/mcp_server.ts';

export { questlogMcpInstructions } from './surface/questlog_mcp_instructions.ts';
export { serveQuestlogMcp } from './surface/serve_questlog_mcp.ts';
export type { McpServerOptions } from './surfaces/mcp_server.ts';
export {
	createMcpServer,
	MCP_LATEST_PROTOCOL_VERSION,
	MCP_SUPPORTED_PROTOCOL_VERSIONS,
} from './surfaces/mcp_server.ts';
export { serveMcpStdio } from './surfaces/mcp_stdio.ts';
export type * from './surfaces/surface_types.ts';

export function createQuestlogMcpServer(options: { db?: QuestlogDb; dbPath?: string } = {}) {
	return createMcpServer(
		questlogMcpOptions(
			() =>
				options.db ??
				openQuestlogDb(
					resolveQuestlogDbPath(options.dbPath === undefined ? {} : { flag: options.dbPath }),
				),
		),
	);
}
