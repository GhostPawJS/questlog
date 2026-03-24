import { initQuestlogTables } from '../init_questlog_tables.ts';
import { captureRumorToolHandler } from '../tools/capture_rumor_tool.ts';
import { manageRepeatableToolHandler } from '../tools/manage_repeatable_tool.ts';
import { organizeWorkToolHandler } from '../tools/organize_work_tool.ts';
import { rewardWorkToolHandler } from '../tools/reward_work_tool.ts';
import { runQuestToolHandler } from '../tools/run_quest_tool.ts';
import { shapeWorkToolHandler } from '../tools/shape_work_tool.ts';
import { tagWorkToolHandler } from '../tools/tag_work_tool.ts';
import type { BrowserQuestlogDb } from './browser_questlog_db.ts';
import { openBrowserQuestlogDb } from './browser_questlog_db.ts';

const HOUR = 3_600_000;
const DAY = 86_400_000;

function ok(result: { ok: boolean; summary: string }) {
	if (!result.ok) throw new Error(`Seed step failed: ${result.summary}`);
}

function seedData(db: BrowserQuestlogDb): void {
	const now = Date.now();

	// --- Rumors ---

	ok(
		captureRumorToolHandler(db, {
			title: 'IGN might cover us if we send early access',
			details:
				'Saw a tweet from an IGN editor asking about upcoming indie releases. Could be a huge visibility boost if we reach out.',
			now: now - 5 * DAY,
		}),
	);

	ok(
		captureRumorToolHandler(db, {
			title: 'Players in the beta found a memory leak in level 3',
			details:
				'Multiple reports on Discord about frame drops after 20 minutes in the swamp biome. Might be the particle system.',
			now: now - 3 * DAY,
		}),
	);

	ok(
		captureRumorToolHandler(db, {
			title: 'The community Discord is asking for a launch day event',
			details:
				'Several active community members suggested a livestream on launch day. Strong signal — 40+ upvotes on the suggestion.',
			now: now - 10 * DAY,
		}),
	);

	ok(
		captureRumorToolHandler(db, {
			title: 'An investor suggested adding NFT integration',
			details:
				"Got an email pitch about blockchain-based item ownership. Doesn't align with our vision at all.",
			now: now - 14 * DAY,
		}),
	);

	// Dismiss the NFT rumor
	ok(
		shapeWorkToolHandler(db, {
			action: 'dismiss_rumor',
			rumorId: 4,
			dismissedAt: now - 12 * DAY,
		}),
	);

	// Settle the community event rumor -> Questline 2
	ok(
		shapeWorkToolHandler(db, {
			action: 'settle_rumor',
			rumorId: 3,
			settledAt: now - 8 * DAY,
			questline: {
				title: 'Community Launch Event',
				description: 'Coordinate a memorable launch day experience for the Discord community.',
			},
			quests: [
				{
					title: 'Book streaming slot for launch day',
					objective: 'Reserve a Twitch/YouTube slot and confirm streaming setup for launch day.',
				},
				{
					title: 'Prepare Discord announcement',
					objective:
						'Draft and finalize the launch day announcement with event schedule, links, and giveaway details.',
				},
				{
					title: 'Run launch day livestream',
					objective: 'Execute a 2-hour livestream covering gameplay, dev commentary, and live Q&A.',
					scheduledStartAt: now + 14 * DAY,
					scheduledEndAt: now + 14 * DAY + 2 * HOUR,
				},
			],
		}),
	);

	// --- Questline 1: Ship v1.0 ---

	ok(
		shapeWorkToolHandler(db, {
			action: 'create_questline',
			questline: {
				title: 'Ship v1.0',
				description:
					'The main workstream for getting the game out the door. Everything from final polish to store submission.',
				dueAt: now + 21 * DAY,
			},
		}),
	);

	// Questline 1 = id 2 (after the community one at id 1)
	const ql1Id = 2;

	ok(
		shapeWorkToolHandler(db, {
			action: 'create_quest',
			quest: {
				title: 'Finalize game balance',
				objective:
					'Complete the final tuning pass on difficulty curves, economy rates, and progression pacing.',
				questlineId: ql1Id,
				tags: ['release'],
				rewards: [
					{
						kind: 'celebration',
						name: 'Team pizza night',
						description: 'Order from the fancy place downtown.',
					},
				],
				now: now - 14 * DAY,
			},
		}),
	);

	ok(
		shapeWorkToolHandler(db, {
			action: 'create_quest',
			quest: {
				title: 'Record trailer voiceover',
				objective:
					'Record, edit, and master the 90-second launch trailer voiceover with the voice actor.',
				questlineId: ql1Id,
				tags: ['marketing'],
				rewards: [
					{
						kind: 'task',
						name: 'Upload trailer to YouTube',
						description: 'Publish the final trailer with optimized metadata.',
					},
				],
				now: now - 10 * DAY,
			},
		}),
	);

	ok(
		shapeWorkToolHandler(db, {
			action: 'create_quest',
			quest: {
				title: 'Final QA pass',
				objective:
					'Run a complete regression test on all game systems, targeting zero critical bugs.',
				questlineId: ql1Id,
				tags: ['release', 'technical'],
				rewards: [
					{
						kind: 'milestone',
						name: 'Launch party',
						description: 'Once QA is green, we celebrate.',
					},
				],
				estimateSeconds: 8 * 3600,
				now: now - 7 * DAY,
			},
		}),
	);

	ok(
		shapeWorkToolHandler(db, {
			action: 'create_quest',
			quest: {
				title: 'Submit to app store',
				objective: 'Package the final build and submit through the app store review process.',
				questlineId: ql1Id,
				tags: ['release', 'technical'],
				now: now - 7 * DAY,
			},
		}),
	);

	ok(
		shapeWorkToolHandler(db, {
			action: 'create_quest',
			quest: {
				title: 'Write patch notes for v1.0',
				objective:
					'Document all changes, fixes, and new features for the public-facing patch notes.',
				questlineId: ql1Id,
				tags: ['release'],
				now: now - 5 * DAY,
			},
		}),
	);

	ok(
		shapeWorkToolHandler(db, {
			action: 'create_quest',
			quest: {
				title: 'Send review copies to press',
				objective: 'Distribute review codes to 15 outlets and follow up with press kit links.',
				questlineId: ql1Id,
				tags: ['marketing'],
				dueAt: now - 2 * DAY,
				now: now - 7 * DAY,
			},
		}),
	);

	// Quest IDs within Ship v1.0 (ql1):
	// Rumor settle created quests 1-3 (community), questline 1 (community)
	// Questline 2 = Ship v1.0
	// Quest 4 = Finalize game balance
	// Quest 5 = Record trailer voiceover
	// Quest 6 = Final QA pass
	// Quest 7 = Submit to app store
	// Quest 8 = Write patch notes
	// Quest 9 = Send review copies

	// --- Lifecycle transitions ---

	// Finalize game balance: done, reward claimed
	ok(runQuestToolHandler(db, { action: 'start', questId: 4, startedAt: now - 12 * DAY }));
	ok(
		runQuestToolHandler(db, {
			action: 'finish',
			questId: 4,
			outcome: 'All balance curves approved by the team.',
			resolvedAt: now - 7 * DAY,
		}),
	);
	ok(
		rewardWorkToolHandler(db, {
			action: 'claim',
			target: { kind: 'reward', id: 1 },
			claimedAt: now - 6 * DAY,
		}),
	);

	// Record trailer voiceover: done, reward unclaimed (yellow ?)
	ok(runQuestToolHandler(db, { action: 'start', questId: 5, startedAt: now - 8 * DAY }));
	ok(
		runQuestToolHandler(db, {
			action: 'finish',
			questId: 5,
			outcome: 'Voiceover recorded and mastered. Sounds great.',
			resolvedAt: now - 3 * DAY,
		}),
	);

	// Final QA pass: in progress, 4h effort logged
	ok(runQuestToolHandler(db, { action: 'start', questId: 6, startedAt: now - 2 * DAY }));
	ok(runQuestToolHandler(db, { action: 'log_effort', questId: 6, effortSeconds: 4 * 3600, now }));

	// Submit to app store: blocked by QA pass (unlock dependency)
	ok(organizeWorkToolHandler(db, { action: 'add_unlock', fromQuestId: 6, toQuestId: 7 }));

	// --- Standalone quests ---

	ok(
		shapeWorkToolHandler(db, {
			action: 'create_quest',
			quest: {
				title: 'Plan post-launch DLC roadmap',
				objective:
					'Outline 3 DLC packs with themes, scope, and rough timelines for the next 6 months.',
				tags: ['planning'],
				notBeforeAt: now + 14 * DAY,
				now: now - 4 * DAY,
			},
		}),
	);

	ok(
		shapeWorkToolHandler(db, {
			action: 'create_quest',
			quest: {
				title: 'Port to Linux before launch',
				objective: 'Set up the Linux build pipeline and validate on Ubuntu and Steam Deck.',
				tags: ['technical'],
				now: now - 12 * DAY,
			},
		}),
	);

	// Abandon the Linux port
	ok(
		runQuestToolHandler(db, {
			action: 'abandon',
			questId: 11,
			outcome: 'Descoped to post-launch. Focus on Windows/Mac for v1.0.',
			resolvedAt: now - 5 * DAY,
		}),
	);

	// --- Repeatable ---

	const wednesday = nearestPastWeekday(now, 3);
	ok(
		manageRepeatableToolHandler(db, {
			action: 'create',
			repeatableQuest: {
				title: 'Weekly playtest session',
				objective: 'Run a structured 1-hour playtest, document bugs found, and rate overall feel.',
				rrule: 'FREQ=WEEKLY;BYDAY=WE',
				anchorAt: wednesday,
				estimateSeconds: 3600,
				tags: ['technical'],
			},
		}),
	);

	// Spawn due instances so the blue ! marker appears
	ok(manageRepeatableToolHandler(db, { action: 'spawn_due', now }));

	// --- Tag the community quests ---

	ok(
		tagWorkToolHandler(db, {
			action: 'replace',
			tagNames: ['community'],
			target: { kind: 'quest', id: 1 },
		}),
	);
	ok(
		tagWorkToolHandler(db, {
			action: 'replace',
			tagNames: ['community'],
			target: { kind: 'quest', id: 2 },
		}),
	);
	ok(
		tagWorkToolHandler(db, {
			action: 'replace',
			tagNames: ['community'],
			target: { kind: 'quest', id: 3 },
		}),
	);
}

function nearestPastWeekday(now: number, targetDay: number): number {
	const d = new Date(now);
	const current = d.getUTCDay();
	const diff = (current - targetDay + 7) % 7 || 7;
	return now - diff * DAY;
}

export async function createDemoSession(mode: 'blank' | 'seeded'): Promise<BrowserQuestlogDb> {
	const db = await openBrowserQuestlogDb();
	initQuestlogTables(db);

	if (mode === 'seeded') {
		seedData(db);
	}

	return db;
}
