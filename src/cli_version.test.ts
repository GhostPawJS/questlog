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

test('machine version formats cover every variant and host target', () => {
	for (const [sea, npm, variant] of [
		[true, true, 'binary'],
		[false, true, 'npm'],
		[false, false, 'library'],
	] as const) {
		for (const platform of ['linux', 'darwin', 'win32']) {
			const options = { sea: () => sea, npm, platform, arch: 'x64' };
			assert.equal(cliVersion('1.2.3', { ...options, args: ['--short'] }), '1.2.3');
			assert.deepEqual(
				JSON.parse(cliVersion('1.2.3', { ...options, args: ['--short', '--json'] })),
				{
					name: 'questlog',
					version: '1.2.3',
					variant,
					target: `${platform === 'win32' ? 'windows' : platform}-x64`,
				},
			);
		}
	}
});
