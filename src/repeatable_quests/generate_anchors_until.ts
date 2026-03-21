import { advanceAnchor } from './advance_anchor.ts';
import { parseRRule } from './parse_rrule.ts';
import { startOfUtcDay } from './start_of_utc_day.ts';
import { startOfUtcWeek } from './start_of_utc_week.ts';
import type { RepeatableQuest } from './types.ts';

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

/**
 * Generates recurrence anchors up to the given moment.
 */
export function generateAnchorsUntil(repeatable: RepeatableQuest, now: number): number[] {
	const rule = parseRRule(repeatable.rrule);
	const anchors: number[] = [];
	const until = rule.until == null ? now : Math.min(now, rule.until);

	if (repeatable.anchorAt > until) {
		return anchors;
	}

	if (rule.freq === 'DAILY') {
		let occurrence = 0;
		for (let current = repeatable.anchorAt; current <= until; current += rule.interval * DAY_MS) {
			occurrence += 1;
			if (rule.count != null && occurrence > rule.count) {
				break;
			}
			anchors.push(current);
		}
		return anchors;
	}

	if (rule.freq === 'WEEKLY' && rule.byDay && rule.byDay.length > 0) {
		const anchorDayStart = startOfUtcDay(repeatable.anchorAt);
		const anchorWeekStart = startOfUtcWeek(anchorDayStart);
		const timeOffset = repeatable.anchorAt - anchorDayStart;
		let occurrence = 0;

		for (let day = anchorDayStart; day <= until; day += DAY_MS) {
			const weeksSince = Math.floor((startOfUtcWeek(day) - anchorWeekStart) / WEEK_MS);
			if (weeksSince < 0 || weeksSince % rule.interval !== 0) {
				continue;
			}
			if (!rule.byDay.includes(new Date(day).getUTCDay())) {
				continue;
			}

			const anchor = day + timeOffset;
			if (anchor < repeatable.anchorAt || anchor > until) {
				continue;
			}

			occurrence += 1;
			if (rule.count != null && occurrence > rule.count) {
				break;
			}
			anchors.push(anchor);
		}

		return anchors;
	}

	let occurrence = 0;
	let current = repeatable.anchorAt;
	while (current <= until) {
		occurrence += 1;
		if (rule.count != null && occurrence > rule.count) {
			break;
		}
		anchors.push(current);
		current = advanceAnchor(current, rule.freq, rule.interval);
	}

	return anchors;
}
