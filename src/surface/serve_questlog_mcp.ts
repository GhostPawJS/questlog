import type { QuestlogDb } from '../database.ts';
import { createMcpServer } from '../surfaces/mcp_server.ts';
import { serveMcpStdio } from '../surfaces/mcp_stdio.ts';
import { openQuestlogDb } from './open_questlog_db.ts';
import { questlogMcpOptions } from './questlog_mcp_options.ts';
import { resolveQuestlogDbPath } from './resolve_questlog_db_path.ts';

export async function serveQuestlogMcp(
	options: { db?: QuestlogDb; dbPath?: string } = {},
): Promise<void> {
	let owned: QuestlogDb | undefined;
	const server = createMcpServer(
		questlogMcpOptions(async () => {
			if (options.db) return options.db;
			owned = await openQuestlogDb(
				resolveQuestlogDbPath(options.dbPath === undefined ? {} : { flag: options.dbPath }),
			);
			return owned;
		}),
	);
	try {
		await serveMcpStdio(server);
	} finally {
		owned?.close();
	}
}
