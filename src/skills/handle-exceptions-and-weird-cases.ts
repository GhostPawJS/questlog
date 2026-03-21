import { defineQuestlogSkill } from './skill_types.ts';

export const handleExceptionsAndWeirdCasesSkill = defineQuestlogSkill({
	name: 'handle-exceptions-and-weird-cases',
	description:
		'Handle weird cases by diagnosing the actual tool outcome, routing into clarification or recovery when needed, and refusing to fake a clean normal-state story.',
	content: `# Handle Exceptions And Weird Cases

Primary tools:
- \`inspect_questlog_item\`
- \`search_questlog\`
- \`review_questlog\`
- then the nearest corrective tool such as \`shape_work\`, \`organize_work\`, \`plan_quest\`, or \`run_quest\`

Steps:
1. Start with diagnosis, not mutation. Use \`inspect_questlog_item\`, \`search_questlog\`, or \`review_questlog\` depending on what is actually unknown.
2. If the tool returns \`needs_clarification\`, stop and answer the missing branch instead of guessing.
3. If the tool returns \`error\`, read the recovery guidance and choose the next corrective tool deliberately.
4. Only mutate state after the weird case has been made specific enough to model honestly.

Outcome handling:
- Treat \`success\` as a real answer, even if that answer is an empty review view.
- Treat \`no_op\` as signal that the requested change was already true.
- Treat \`needs_clarification\` as expected when the system can enumerate the ambiguity safely.
- Treat \`error\` as a structured boundary, not as a cue to improvise around the rules.

Failure handling:
- Do not force a weird case into a fake normal flow just to keep moving.
- Do not guess among multiple plausible targets.
- Do not mutate first and inspect later.`,
});
