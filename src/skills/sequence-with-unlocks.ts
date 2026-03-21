import { defineQuestlogSkill } from './skill_types.ts';

export const sequenceWithUnlocksSkill = defineQuestlogSkill({
	name: 'sequence-with-unlocks',
	description:
		'Model hard sequencing with unlocks between concrete quests so blocked and available work stay truthful and reviewable.',
	content: `# Sequence With Unlocks

Primary tools:
- \`organize_work\`
- \`review_questlog\`
- \`inspect_questlog_item\`
- \`shape_work\`

Steps:
1. Create the concrete quests first, then use \`organize_work\` with \`add_unlock\`, \`remove_unlock\`, or \`replace_unlocks\` to model hard gates.
2. Use \`review_questlog\` to confirm the effect in the blocked and available views.
3. Use \`inspect_questlog_item\` when the exact unlock graph on one quest needs diagnosis.
4. Treat unlocks as hard prerequisites, not as soft notes or labels.

Outcome handling:
- Treat \`success\` as a real unlock graph change.
- Treat \`no_op\` as confirmation that the blocker set already matched.
- Treat \`error\` as a real constraint problem such as self-unlock or cycle creation.

Failure handling:
- Do not use unlocks for work that is merely preferred or informative.
- Do not ignore blocked review results after adding an unlock.
- Do not force a dependency graph that violates the cycle rules.`,
});
