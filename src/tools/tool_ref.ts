import type { Questline, QuestlineDetail } from '../questlines/types';
import { deriveQuestState } from '../quests/derive_quest_state';
import type { Quest, QuestDetail } from '../quests/types';
import type { DueRepeatableAnchor, RepeatableQuest } from '../repeatable_quests/types';
import type { QuestReward } from '../rewards/types';
import { deriveRumorState } from '../rumors/derive_rumor_state';
import type { Rumor, RumorDetail } from '../rumors/types';
import type { QuestlogSearchResult } from '../search_result';
import type { ToolEntityRef, ToolListItem } from './tool_types';

export function toQuestRef(quest: Quest | QuestDetail): ToolEntityRef {
	return {
		kind: 'quest',
		id: quest.id,
		title: quest.title,
		markerId: 'markerId' in quest ? quest.markerId : null,
		state:
			'state' in quest
				? quest.state
				: deriveQuestState({
						startedAt: quest.startedAt,
						resolvedAt: quest.resolvedAt,
						success: quest.success,
					}),
	};
}

export function toQuestListItem(quest: QuestDetail): ToolListItem {
	return {
		...toQuestRef(quest),
		subtitle: quest.objective,
		dueAt: quest.effectiveDueAt,
		available: quest.available,
	};
}

export function toQuestlineRef(questline: Questline | QuestlineDetail): ToolEntityRef {
	return {
		kind: 'questline',
		id: questline.id,
		title: questline.title,
		state: questline.archivedAt == null ? 'active' : 'archived',
	};
}

export function toQuestlineListItem(questline: QuestlineDetail): ToolListItem {
	return {
		...toQuestlineRef(questline),
		subtitle: questline.description ?? undefined,
		dueAt: questline.dueAt,
		available: questline.availableQuests > 0,
	};
}

export function toRepeatableQuestRef(repeatable: RepeatableQuest): ToolEntityRef {
	return {
		kind: 'repeatable_quest',
		id: repeatable.id,
		title: repeatable.title,
		state: repeatable.archivedAt == null ? 'active' : 'archived',
	};
}

export function toRepeatableQuestListItem(repeatable: RepeatableQuest): ToolListItem {
	return {
		...toRepeatableQuestRef(repeatable),
		subtitle: repeatable.objective,
		dueAt: repeatable.anchorAt,
	};
}

export function toRepeatableAnchorListItem(
	anchor: DueRepeatableAnchor,
	repeatable?: RepeatableQuest,
): ToolListItem {
	return {
		kind: 'repeatable_quest',
		id: anchor.repeatableQuestId,
		title: repeatable?.title,
		markerId: anchor.markerId,
		state: repeatable?.archivedAt == null ? 'active' : 'archived',
		dueAt: anchor.anchorAt,
		subtitle: repeatable?.objective,
	};
}

export function toRumorRef(rumor: Rumor | RumorDetail): ToolEntityRef {
	return {
		kind: 'rumor',
		id: rumor.id,
		title: rumor.title,
		markerId: rumor.markerId,
		state: 'state' in rumor ? rumor.state : deriveRumorState(rumor),
	};
}

export function toRumorListItem(rumor: Rumor): ToolListItem {
	return {
		...toRumorRef(rumor),
		subtitle: rumor.details ?? undefined,
	};
}

export function toRewardRef(reward: QuestReward): ToolEntityRef {
	return {
		kind: 'reward',
		id: reward.id,
		title: reward.name,
		state: reward.claimedAt == null ? 'unclaimed' : 'claimed',
	};
}

export function toSearchListItem(result: QuestlogSearchResult): ToolListItem {
	return {
		kind: result.entityKind,
		id: result.entityId,
		title: result.title,
		markerId: result.markerId,
		snippet: result.snippet,
	};
}
