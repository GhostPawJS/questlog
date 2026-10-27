// Fields required by each action in addition to the tool's common fields.
export const actionRequirements: Record<string, Record<string, readonly string[]>> = {
	shape_work: {
		create_quest: ['quest'],
		create_questline: ['questline'],
		attach_quest_to_questline: ['questId', 'questlineId'],
		detach_quest_from_questline: ['questId'],
		dismiss_rumor: ['rumorId'],
		reopen_rumor: ['rumorId'],
		settle_rumor: ['rumorId'],
		update_rumor: ['rumorId'],
	},
	manage_repeatable: {
		create: ['repeatableQuest'],
		archive: ['repeatableQuestId'],
		update: ['repeatableQuestId'],
		spawn_due: ['now'],
	},
	organize_work: {
		add_unlock: ['fromQuestId', 'toQuestId'],
		remove_unlock: ['fromQuestId', 'toQuestId'],
		replace_unlocks: ['fromQuestIds', 'toQuestId'],
		archive_questline: ['questlineId'],
		set_questline_fields: ['questlineId'],
	},
	plan_quest: { revise_objective: ['objective'] },
	run_quest: {
		abandon_and_spawn_followups: ['followups'],
		log_effort: ['effortSeconds'],
	},
	reward_work: { add: ['reward'], update: ['reward'], replace_repeatable_template: ['rewards'] },
};
