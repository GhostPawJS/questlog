import type { Readable, Writable } from 'node:stream';
import { type CliSpec, CliUsageError, parseCliArgs, renderCliHelp } from './cli_args.ts';
import { enrichPlainJson, suggestCommand } from './cli_output.ts';
import { minimalInput } from './schema_examples.ts';
import { isErrorResult, type JsonSchema, type SurfaceTool } from './surface_types.ts';
import { validateInput } from './validate_input.ts';

export interface PlainCliCommand<TCtx> {
	spec: CliSpec;
	tool: string;
	input(values: Record<string, unknown>): Record<string, unknown>;
	render(result: unknown, context: TCtx, values: Record<string, unknown>): string;
}
export interface ToolCliOptions<TCtx> {
	bin: string;
	version: string;
	versionLine?: () => string;
	description: string;
	describeDb?: (opts: { db?: string }) => string;
	tools: readonly SurfaceTool<TCtx>[];
	openContext(opts: { db?: string }): TCtx | Promise<TCtx>;
	closeContext?: (ctx: TCtx) => void | Promise<void>;
	commands?: {
		plain?: readonly PlainCliCommand<TCtx>[];
		mcp?: (opts: { db?: string }) => unknown | Promise<unknown>;
		skill?: () => string | Promise<string>;
		guides?: readonly { name: string; description: string; content: string }[];
	};
	stdin?: Readable & { isTTY?: boolean };
	stdout?: Writable;
	stderr?: Writable;
}
export async function runToolCli<TCtx>(
	argv: string[],
	options: ToolCliOptions<TCtx>,
): Promise<number> {
	const stdout = options.stdout ?? process.stdout;
	const stderr = options.stderr ?? process.stderr;
	const stdin = options.stdin ?? process.stdin;
	const args = [...argv];
	let db: string | undefined;
	let compact = false;
	const fail = (message: string, code = 2) => {
		stderr.write(`${message}\n`);
		return code;
	};
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--db') {
			if (!args[i + 1] || args[i + 1]?.startsWith('--')) return fail('--db requires a path');
			db = args[i + 1];
			args.splice(i, 2);
			i--;
		} else if (args[i] === '--compact') {
			compact = true;
			args.splice(i, 1);
			i--;
		}
	}
	const ctxOptions = db === undefined ? {} : { db };
	const command = args.shift() ?? 'help';
	const normalize = (name: string) => name.replace(/[-_]/g, '').toLowerCase();
	if (['help', '--help', '-h'].includes(command)) {
		stdout.write(
			`${options.bin} ${options.version}\n${options.description}\n\nUsage: ${options.bin} [--db path] <command>\nCommands: ${options.commands?.plain?.map((entry) => entry.spec.command).join(', ') ?? ''}${options.commands?.plain?.length ? ', ' : ''}tools [--json], describe <tool>, call <tool> [JSON|-], <tool> --parameter value, mcp, skill\nOptions: --help, --version, --compact, --db <path>\n${options.describeDb ? `${options.describeDb(ctxOptions)}\n` : ''}\n${options.tools.map((tool) => `${tool.name}  ${tool.description}`).join('\n')}\n`,
		);
		return 0;
	}
	if (['--version', '-v'].includes(command)) {
		stdout.write(`${options.versionLine?.() ?? options.version}\n`);
		return 0;
	}
	if (command === 'tools') {
		stdout.write(
			args.includes('--json')
				? `${JSON.stringify(
						options.tools.map(({ handler: _handler, ...tool }) => tool),
						null,
						2,
					)}\n`
				: `${options.tools.map((tool) => `${tool.name}\t${tool.description.replace(/\s+/g, ' ')}`).join('\n')}\n`,
		);
		return 0;
	}
	if (command === 'skill') {
		if (!options.commands?.skill) return fail('skill command unavailable');
		if (args.length > 1) return fail(`Usage: ${options.bin} skill [--list | <guide> | --help]`);
		const guide = args[0];
		if (guide === '--help' || guide === '-h') {
			stdout.write(
				`Usage:\n  ${options.bin} skill\n  ${options.bin} skill --list\n  ${options.bin} skill <guide>\n`,
			);
		} else if (guide === '--list') {
			stdout.write(
				`${(options.commands.guides ?? [])
					.map((entry) => `${entry.name}  ${entry.description.replace(/\s+/g, ' ')}`)
					.join('\n')}\n`,
			);
		} else if (guide) {
			const entry = options.commands.guides?.find((entry) => entry.name === guide);
			if (!entry) return fail(`unknown guide ${guide}; run ${options.bin} skill --list`);
			stdout.write(entry.content);
		} else stdout.write(await options.commands.skill());
		return 0;
	}
	if (command === 'mcp') {
		if (!options.commands?.mcp) return fail('mcp command unavailable');
		await options.commands.mcp(ctxOptions);
		return 0;
	}
	const plain = options.commands?.plain?.find((entry) => entry.spec.command === command);
	let plainValues: Record<string, unknown> = {};
	if (plain) {
		if (args.includes('--help') || args.includes('-h')) {
			stdout.write(
				renderCliHelp({
					...plain.spec,
					command: `${options.bin} ${command}`,
					flags: [
						...(plain.spec.flags ?? []),
						{ name: 'db', type: 'string' },
						{ name: 'compact', type: 'boolean' },
					],
				}),
			);
			return 0;
		}
		try {
			plainValues = parseCliArgs(args, plain.spec);
		} catch (cause) {
			return fail(String(cause), cause instanceof CliUsageError ? 2 : 1);
		}
	}
	const name = plain
		? plain.tool
		: command === 'call' || command === 'describe'
			? args.shift()
			: command;
	const tool = options.tools.find((tool) => normalize(tool.name) === normalize(name ?? ''));
	if (!tool) {
		if (command === 'call' || command === 'describe') return fail(`Unknown tool: ${name ?? ''}`);
		const suggestion = suggestCommand(command, [
			...(options.commands?.plain?.map((entry) => entry.spec.command) ?? []),
			'help',
			'tools',
			'describe',
			'call',
			'mcp',
			'skill',
			...options.tools.map((entry) => entry.name),
		]);
		return fail(`Unknown command: ${command}.${suggestion ? ` Did you mean ${suggestion}?` : ''}`);
	}
	if (command === 'describe') {
		stdout.write(
			`${tool.name}\n${tool.description}\nUse when: ${tool.whenToUse ?? ''}\nNot for: ${tool.whenNotToUse ?? ''}\nRead only: ${tool.readOnly ?? false}\n\nParameter | Type | Required | Description\n${Object.entries(
				tool.inputSchema.properties ?? {},
			)
				.map(
					([key, schema]) =>
						`${key} | ${schema.type ?? 'oneOf'} | ${tool.inputSchema.required?.includes(key) ?? false} | ${schema.description ?? ''}`,
				)
				.join('\n')}\n\n${JSON.stringify(tool.inputSchema, null, 2)}\n`,
		);
		return 0;
	}
	let input: unknown = {};
	try {
		const readStdin = async () => {
			let text = '';
			for await (const chunk of stdin) text += String(chunk);
			return text;
		};
		if (plain) {
			input = plain.input(plainValues);
		} else if (command === 'call') {
			if (args.length > 1) return fail('Expected a single JSON argument');
			const raw = args[0];
			input = JSON.parse(
				raw === '-' || (raw === undefined && !stdin.isTTY) ? await readStdin() : (raw ?? '{}'),
			);
		} else {
			const values: Record<string, unknown> = {};
			const coerce = (value: string, schema: JsonSchema): unknown => {
				if (schema.type === 'number' || schema.type === 'integer') return Number(value);
				if (schema.type === 'boolean') {
					if (!['true', 'false'].includes(value)) throw new Error('Expected true or false');
					return value === 'true';
				}
				if (schema.type === 'object' || schema.type === 'array') return JSON.parse(value);
				if (schema.oneOf) {
					for (const branch of schema.oneOf) {
						try {
							const converted = coerce(value, branch);
							if (!validateInput(branch, converted).length) return converted;
						} catch {
							/* Try the next schema. */
						}
					}
				}
				return value;
			};
			while (args.length) {
				const flag = args.shift();
				if (!flag?.startsWith('--')) return fail(`Expected parameter flag: ${flag}`);
				const equal = flag.indexOf('=');
				const key = equal === -1 ? flag.slice(2) : flag.slice(2, equal);
				const property = Object.keys(tool.inputSchema.properties ?? {}).find(
					(name) => normalize(name) === normalize(key),
				);
				if (!property) return fail(`Unknown parameter: ${key}`);
				const schema = tool.inputSchema.properties?.[property] as JsonSchema;
				const raw =
					equal === -1
						? schema.type === 'boolean' && (!args[0] || args[0].startsWith('--'))
							? 'true'
							: args.shift()
						: flag.slice(equal + 1);
				if (raw === undefined) return fail(`Missing value: ${key}`);
				if (schema.type === 'array' && !raw.startsWith('[')) {
					const prior = values[property];
					values[property] = [
						...(Array.isArray(prior) ? prior : []),
						coerce(raw, schema.items ?? {}),
					];
				} else values[property] = coerce(raw, schema);
			}
			input = values;
		}
	} catch (cause) {
		if (cause instanceof CliUsageError) return fail(cause.message, 2);
		return fail(`Invalid input: ${cause instanceof Error ? cause.message : String(cause)}`, 1);
	}
	const errors = validateInput(tool.inputSchema, input);
	if (errors.length)
		return fail(
			`${errors.join('\n')}; pass ${JSON.stringify(minimalInput(tool.inputSchema, (input as Record<string, unknown> | null)?.action))}`,
			1,
		);
	let context: TCtx;
	try {
		context = await options.openContext(ctxOptions);
	} catch (cause) {
		return fail(String(cause), 1);
	}
	try {
		const result = await tool.handler(context, input as Record<string, unknown>);
		stdout.write(
			plain && !plainValues.json
				? plain.render(result, context, plainValues)
				: `${JSON.stringify(plain ? enrichPlainJson(result) : result, null, compact ? undefined : 2)}\n`,
		);
		if (
			typeof result === 'object' &&
			result !== null &&
			'outcome' in result &&
			result.outcome === 'needs_clarification'
		)
			return 3;
		return isErrorResult(result) ? 1 : 0;
	} catch (cause) {
		return fail(String(cause), 1);
	} finally {
		await options.closeContext?.(context);
	}
}
