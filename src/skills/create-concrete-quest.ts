import { defineQuestlogSkill } from './skill_types.ts';

export const createConcreteQuestSkill = defineQuestlogSkill({
	name: 'create-concrete-quest',
	description:
		'Create real, bounded executable quests only when the objective is concrete enough to execute without interpretive guesswork.',
	content: `# Create Concrete Quest

Primary tools:
- \`shape_work\`
- \`inspect_questlog_item\`
- \`plan_quest\`

Steps:
1. Use \`shape_work\` with \`action: "create_quest"\` only when there is one clear executable objective.
2. Put shared arc context in a questline, not inside a bloated quest objective.
3. Use \`inspect_questlog_item\` after creation when you need to confirm the exact quest detail that was created.
4. Use \`plan_quest\` later for timing or estimate refinement instead of overloading creation with every downstream decision.

Outcome handling:
- Treat \`success\` as confirmation that a concrete quest now exists.
- Treat \`error\` as a sign that the requested quest input is invalid and should be repaired before retrying.

Failure handling:
- If the objective still needs interpretation, go back to intake or clarification instead of creating the quest.
- If the work is really multi-step, use questline structure instead of one overloaded quest.
- Do not create a quest whose title and objective hide uncertainty.`,
});
