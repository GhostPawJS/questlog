import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Writable } from 'node:stream';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { questlogSkills } from '../skills/skill_registry.ts';
import { runToolCli } from '../surfaces/cli.ts';
import { createMcpServer } from '../surfaces/mcp_server.ts';
import { renderSkillMarkdown } from '../surfaces/skill_markdown.ts';
import { validateInput } from '../surfaces/validate_input.ts';
import type { ToolResult } from '../tools/tool_types.ts';
import { questlogCliOptions } from './questlog_cli_options.ts';
import { questlogSkillSpec } from './questlog_skill_spec.ts';
import { questlogSurfaceTools } from './questlog_surface_tools.ts';

test('skill commands embed every committed guide and explain usage errors', async () => {
	let output = '';
	const stream = new Writable({
		write(chunk, _encoding, done) {
			output += String(chunk);
			done();
		},
	});
	const run = async (args: string[]) => {
		output = '';
		const code = await runToolCli(['skill', ...args], {
			...questlogCliOptions,
			stdout: stream,
			stderr: stream,
			openContext() {
				throw new Error('skill must not open a database');
			},
		});
		return { code, output };
	};
	for (const guide of questlogSkills) {
		assert.deepEqual(await run([guide.name]), {
			code: 0,
			output: readFileSync(`skills/questlog/references/${guide.name}.md`, 'utf8'),
		});
	}
	assert.equal(
		(await run(['--list'])).output.split('\n').filter(Boolean).length,
		questlogSkills.length,
	);
	assert.match((await run(['--help'])).output, /skill <guide>/);
	assert.deepEqual(await run(['missing']), {
		code: 2,
		output: 'unknown guide missing; run ghostpaw-questlog skill --list\n',
	});
});

test('every rendered call example validates against its tool schema', () => {
	const markdown = renderSkillMarkdown(questlogSkillSpec);
	const examples = [...markdown.matchAll(/^ghostpaw-questlog call (\w+) '(.*)'$/gm)];
	assert.ok(examples.length >= questlogSurfaceTools.length);
	for (const [, name, json] of examples) {
		const tool = questlogSurfaceTools.find((tool) => tool.name === name);
		assert.ok(tool);
		assert.deepEqual(validateInput(tool.inputSchema, JSON.parse(json ?? '')), [], name);
	}
	const opening = markdown.split('## Without the binary')[0] ?? '';
	assert.doesNotMatch(opening, /\bnpx\b|\bnpm\b|Node\.js 24/);
	assert.match(markdown, /\| quest.title \| string \| yes \|/);
});

test('all surface tools reject missing and partial inputs without system errors', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		for (const tool of questlogSurfaceTools) {
			const cases: Record<string, unknown>[] = [{}];
			for (const action of tool.inputSchema.properties?.action?.enum ?? [undefined]) {
				const base = action === undefined ? {} : { action };
				cases.push(base);
				for (const [name, property] of Object.entries(tool.inputSchema.properties ?? {})) {
					if (
						property.type === 'object' ||
						property.oneOf?.some((branch) => branch.type === 'object')
					)
						cases.push({ ...base, [name]: {} });
				}
			}
			for (const input of cases) {
				const result = (await tool.handler(db, input)) as ToolResult<unknown>;
				assert.ok(result, `${tool.name} ${JSON.stringify(input)}`);
				if (result.outcome === 'error') {
					assert.notEqual(result.error.kind, 'system', `${tool.name}: ${result.error.message}`);
					assert.notEqual(result.error.code, 'system_error');
					if (result.error.code === 'invalid_input') assert.ok(result.error.recovery);
				}
			}
		}
	} finally {
		db.close();
	}
});

test('CLI and MCP validation name the missing nested path and supply a valid shape', async () => {
	let output = '';
	const stream = new Writable({
		write(chunk, _encoding, done) {
			output += String(chunk);
			done();
		},
	});
	const code = await runToolCli(['call', 'shape_work', '{"action":"create_quest","quest":{}}'], {
		...questlogCliOptions,
		stdout: stream,
		stderr: stream,
		openContext() {
			throw new Error('invalid calls must not open a database');
		},
	});
	assert.equal(code, 1);
	assert.match(output, /quest.title: required/);
	assert.match(output, /pass {"action":"create_quest","quest":/);
	const server = createMcpServer({
		name: 'questlog',
		version: '1',
		tools: questlogSurfaceTools,
		context() {
			throw new Error('invalid calls must not open a database');
		},
	});
	const response = await server.handleLine(
		JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'tools/call',
			params: {
				_meta: {
					'io.modelcontextprotocol/protocolVersion': '2026-07-28',
					'io.modelcontextprotocol/clientCapabilities': {},
				},
				name: 'shape_work',
				arguments: { action: 'create_quest', quest: {} },
			},
		}),
	);
	assert.ok(response);
	const result = JSON.parse(response).result;
	assert.equal(result.isError, true);
	assert.match(result.content[0].text, /quest.title: required/);
	assert.match(result.content[0].text, /pass {"action":"create_quest","quest":/);
});
