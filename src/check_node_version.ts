export function checkNodeVersion(
	version: string,
	stderr: { write(text: string): unknown },
): boolean {
	if (Number(version.split('.')[0]) >= 24) return true;
	stderr.write(
		`questlog needs Node 24+ (found ${version}). Install Node 24 or put it first on PATH.\n`,
	);
	return false;
}
