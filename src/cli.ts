import { checkNodeVersion } from './check_node_version.ts';

if (!checkNodeVersion(process.versions.node, process.stderr)) {
	process.exitCode = 2;
} else {
	await import('./cli_main.ts');
}
