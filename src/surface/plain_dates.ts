import { CliUsageError } from '../surfaces/cli_args.ts';

export function parsePlainDue(raw: string, now = Date.now()): number {
	const invalid = () =>
		new CliUsageError(
			`Invalid --due "${raw}". Use YYYY-MM-DD, DD.MM.YYYY, today, tomorrow, +Nd (for example +3d), integer epoch milliseconds, or YYYY-MM-DDTHH:mm[:ss[.fraction]][Z|±HH:mm] (no zone means local time).`,
		);
	if (/^-?\d+$/.test(raw)) {
		const value = Number(raw);
		if (Number.isSafeInteger(value) && Number.isFinite(new Date(value).getTime())) return value;
		throw invalid();
	}
	const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
	const european = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(raw);
	let date: Date;
	if (iso || european) {
		const year = Number(iso?.[1] ?? european?.[3]);
		const month = Number(iso?.[2] ?? european?.[2]);
		const day = Number(iso?.[3] ?? european?.[1]);
		date = new Date(0);
		date.setFullYear(year, month - 1, day);
		date.setHours(23, 59, 59, 999);
		if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
			throw invalid();
	} else if (raw === 'today' || raw === 'tomorrow' || /^\+\d+d$/.test(raw)) {
		date = new Date(now);
		date.setDate(
			date.getDate() + (raw === 'today' ? 0 : raw === 'tomorrow' ? 1 : Number(raw.slice(1, -1))),
		);
		date.setHours(23, 59, 59, 999);
	} else {
		if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(raw))
			throw invalid();
		parsePlainDue(raw.slice(0, 10), now);
		date = new Date(raw);
	}
	if (!Number.isFinite(date.getTime())) throw invalid();
	return date.getTime();
}

export function formatPlainDate(value: number, full = false, now = Date.now()): string {
	const date = new Date(value);
	const month = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	][date.getMonth()];
	const year =
		full || date.getFullYear() !== new Date(now).getFullYear() ? ` ${date.getFullYear()}` : '';
	const endOfDay =
		date.getHours() === 23 &&
		date.getMinutes() === 59 &&
		date.getSeconds() === 59 &&
		date.getMilliseconds() === 999;
	const time = endOfDay
		? ''
		: ` ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
	return `${date.getDate()} ${month}${year}${time}`;
}
