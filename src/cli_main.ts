import { questlogCliOptions } from './surface/questlog_cli_options.ts';
import { runToolCli } from './surfaces/cli.ts';

process.exitCode = await runToolCli(process.argv.slice(2), questlogCliOptions);
