import { defineQuestlogSkill } from './skill_types.ts';

export const frameInitiativeQuestlineSkill = defineQuestlogSkill({
	name: 'frame-initiative-questline',
	description:
		'Use questlines for shared initiative context, then attach concrete quests and maintain the structure without confusing one quest with one arc.',
	content: `# Frame Initiative Questline

Primary tools:
- \`shape_work\`
- \`organize_work\`
- \`review_questlog\`
- \`inspect_questlog_item\`

Steps:
1. Use \`shape_work\` with \`create_questline\` when several related quests need one umbrella initiative.
2. Use \`shape_work\` with \`attach_quest_to_questline\` or \`detach_quest_from_questline\` to place concrete quests correctly inside the initiative.
3. Use \`organize_work\` to update questline fields or archive the questline once the arc is truly retired.
4. Use \`review_questlog\` and \`inspect_questlog_item\` to verify the initiative health and exact structure.

Outcome handling:
- Treat \`success\` as a real questline or membership change.
- Treat \`no_op\` as confirmation that the quest was already attached or detached as requested.
- Treat \`error\` as a sign that the target ids or structural state are invalid.

Failure handling:
- Do not create a questline for one isolated executable task.
- Do not leave membership implied; attach or detach quests explicitly.
- Do not archive a questline just to hide active work that still matters.`,
});
