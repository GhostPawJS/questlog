import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cliVersion } from './cli_version.ts';

test('human version identifies binary, npm and library variants', () => {
	assert.equal(cliVersion('1.2.3', { sea: () => false, npm: false }), 'questlog 1.2.3 (library)');
	assert.equal(cliVersion('1.2.3', { sea: () => false, npm: true }), 'questlog 1.2.3 (npm)');
	for (const [platform, arch, target] of [
		['linux', 'x64', 'linux-x64'],
		['darwin', 'arm64', 'darwin-arm64'],
		['win32', 'x64', 'windows-x64'],
	] as const) {
		assert.equal(
			cliVersion('1.2.3', { sea: () => true, npm: true, platform, arch }),
			`questlog 1.2.3 (binary, ${target})`,
		);
	}
	assert.equal(
		cliVersion('1.2.3', {
			sea: () => {
				throw new Error('unavailable');
			},
			npm: false,
		}),
		'questlog 1.2.3 (library)',
	);
});
