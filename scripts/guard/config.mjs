import assert from 'node:assert/strict';
export const packageName = '@ghostpaw/questlog';
export const publicEntries = ['.', './mcp'];
export const binName = 'ghostpaw-questlog';
export const extraFiles = ['SKILL.md', 'skills/questlog/SKILL.md'];
export const entries = {
	full: `export * from './dist/index.js';`,
	tools: `import {tools} from './dist/index.js'; export const registry = tools.questlogTools;`,
	'read-write': `export {read, write} from './dist/index.js';`,
	mcp: `export * from './dist/mcp.js';`,
	cli: { entryPoints: ['dist/cli.js'] },
	'mcp-server': { entryPoints: ['dist/mcp-server.js'] },
};
export const claim = { title: 'Review jasmine tea planning', details: 'Review release plans' };
export const search = { query: 'jasmine tea' };
export const modernMeta = {
	'io.modelcontextprotocol/protocolVersion': '2026-07-28',
	'io.modelcontextprotocol/clientCapabilities': {},
};
export const discover = {
	jsonrpc: '2.0',
	id: 4,
	method: 'server/discover',
	params: { _meta: modernMeta },
};
export const searchRequest = {
	jsonrpc: '2.0',
	id: 5,
	method: 'tools/call',
	params: { name: 'search_questlog', arguments: search, _meta: modernMeta },
};
export const legacyRequests = [
	{
		jsonrpc: '2.0',
		id: 1,
		method: 'initialize',
		params: {
			protocolVersion: '2025-11-25',
			capabilities: {},
			clientInfo: { name: 'guard', version: '1' },
		},
	},
	{ jsonrpc: '2.0', id: 2, method: 'tools/list' },
	{
		jsonrpc: '2.0',
		id: 3,
		method: 'tools/call',
		params: { name: 'search_questlog', arguments: search },
	},
];
export const cliRemember = ['call', 'capture_rumor', JSON.stringify(claim)];
export const cliSearch = ['call', 'search_questlog', JSON.stringify(search)];
export function assertApi(root, mcp) {
	for (const key of ['initQuestlogTables', 'read', 'write', 'tools']) assert.ok(root[key], key);
	assert.equal(typeof mcp.createQuestlogMcpServer, 'function');
}
export function smokeLibrary(api, db) {
	api.initQuestlogTables(db);
	const item = api.write.captureRumor(db, claim);
	assert.ok(
		api.read
			.searchQuestlog(db, search.query)
			.some((value) => value.entityKind === 'rumor' && value.entityId === item.id),
	);
}
export const typeConsumer = `import {DatabaseSync} from 'node:sqlite';
import {initQuestlogTables, read, write} from '${packageName}';
import {createQuestlogMcpServer} from '${packageName}/mcp';
const db = new DatabaseSync(':memory:'); initQuestlogTables(db);
write.createQuest(db, {title: 'Tea', objective: 'Make tea'});
read.searchQuestlog(db, 'tea'); createQuestlogMcpServer({db});`;
export function createServer(mcp, db) {
	return mcp.createQuestlogMcpServer({ db });
}
export function hotPaths(api, db, server) {
	return {
		'write.createQuest': (i) => api.write.createQuest(db, seedClaim(i)),
		'read.searchQuestlog': () => api.read.searchQuestlog(db, 'planning'),
		search_questlog: () => api.tools.getQuestlogToolByName('search_questlog').handler(db, search),
		'MCP tools/call': () => server.handleLine(JSON.stringify(searchRequest)),
	};
}
export function seedClaim(i) {
	return {
		title: `Review planning project ${i}`,
		objective: `Review release notes for project ${i}`,
	};
}

export function consumerSmoke(configUrl) {
	return `import {createRequire} from 'node:module'; import {DatabaseSync} from 'node:sqlite';
 import {assertApi,smokeLibrary} from ${JSON.stringify(configUrl)};
 const require = createRequire(import.meta.url);
 const root = await import(${JSON.stringify(packageName)}); const mcp = await import(${JSON.stringify(`${packageName}/mcp`)});
 assertApi(root,mcp); assertApi(require(${JSON.stringify(packageName)}),require(${JSON.stringify(`${packageName}/mcp`)}));
 const db = new DatabaseSync(':memory:'); try {smokeLibrary(root,db);} finally {db.close();}`;
}
export function assertRoundTrip(remembered, searched) {
	assert.equal(remembered.outcome, 'success');
	assert.ok(searched.data.items.some((item) => item.id === remembered.data.rumor.id));
}
export function assertMcpReplies(replies, remembered) {
	assert.ok(replies[1].result.tools.some((tool) => tool.name === 'search_questlog'));
	assert.ok(
		replies[2].result.structuredContent.data.items.some(
			(item) => item.id === remembered.data.rumor.id,
		),
	);
	assert.equal(replies[3].result.resultType, 'complete');
}
