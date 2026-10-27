import { markNpmEntry } from './cli_version.ts';
import { questlogCliOptions } from './surface/questlog_cli_options.ts';
import { runToolCli } from './surfaces/cli.ts';

markNpmEntry();

process.exitCode = await runToolCli(process.argv.slice(2), questlogCliOptions);
