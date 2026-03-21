import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseRRule } from './parse_rrule';

describe('parseRRule', () => {
	it('parses minimal DAILY rule', () => {
		const r = parseRRule('FREQ=DAILY');
		strictEqual(r.freq, 'DAILY');
		strictEqual(r.interval, 1);
		strictEqual(r.count, null);
		strictEqual(r.until, null);
		strictEqual(r.byDay, null);
	});

	it('rejects unsupported FREQ', () => {
		throws(() => parseRRule('FREQ=HOURLY'), /Unsupported RRULE FREQ/);
		throws(() => parseRRule('INTERVAL=1'), /Unsupported RRULE FREQ/);
	});

	it('validates INTERVAL', () => {
		throws(() => parseRRule('FREQ=DAILY;INTERVAL=0'), /INTERVAL must be a positive integer/);
		throws(() => parseRRule('FREQ=DAILY;INTERVAL=-1'), /INTERVAL must be a positive integer/);
	});

	it('validates COUNT', () => {
		throws(() => parseRRule('FREQ=DAILY;COUNT=0'), /COUNT must be a positive integer/);
	});

	it('validates UNTIL', () => {
		throws(() => parseRRule('FREQ=DAILY;UNTIL=not-a-date'), /UNTIL must be parseable/);
	});

	it('parses BYDAY tokens', () => {
		const r = parseRRule('FREQ=WEEKLY;BYDAY=MO,WE');
		strictEqual(r.byDay?.length, 2);
	});

	it('rejects unknown BYDAY token', () => {
		throws(() => parseRRule('FREQ=WEEKLY;BYDAY=XX'), /Unsupported RRULE BYDAY token/);
	});
});
