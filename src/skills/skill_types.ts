export interface QuestlogSkill {
	name: string;
	description: string;
	content: string;
}

export type QuestlogSkillRegistry = readonly QuestlogSkill[];

export function defineQuestlogSkill<TSkill extends QuestlogSkill>(skill: TSkill): TSkill {
	return skill;
}
