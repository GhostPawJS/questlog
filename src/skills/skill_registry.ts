import { archiveDeleteAndPruneSkill } from './archive-delete-and-prune.ts';
import { chooseWorkShapeSkill } from './choose-work-shape.ts';
import { clarifyAmbiguousRequestsSkill } from './clarify-ambiguous-requests.ts';
import { closeWorkAndClaimOutcomesSkill } from './close-work-and-claim-outcomes.ts';
import { createConcreteQuestSkill } from './create-concrete-quest.ts';
import { detectSlipsAndStalenessSkill } from './detect-slips-and-staleness.ts';
import { escalateAndUnblockSkill } from './escalate-and-unblock.ts';
import { frameInitiativeQuestlineSkill } from './frame-initiative-questline.ts';
import { handleExceptionsAndWeirdCasesSkill } from './handle-exceptions-and-weird-cases.ts';
import { intakeTriageSkill } from './intake-triage.ts';
import { maintainClearOwnershipSkill } from './maintain-clear-ownership.ts';
import { manageApprovalsAndPromisesSkill } from './manage-approvals-and-promises.ts';
import { planSuccessorWorkSkill } from './plan-successor-work.ts';
import { planTimeCorrectlySkill } from './plan-time-correctly.ts';
import { prioritizeAcrossStreamsSkill } from './prioritize-across-streams.ts';
import { protectCapacityAndFocusSkill } from './protect-capacity-and-focus.ts';
import { recoverFromModelingMistakesSkill } from './recover-from-modeling-mistakes.ts';
import { reportStatusAndManageExpectationsSkill } from './report-status-and-manage-expectations.ts';
import { reviseOrReshapeCommitmentSkill } from './revise-or-reshape-commitment.ts';
import { runOperationalReviewSkill } from './run-operational-review.ts';
import { runRecurringRhythmsSkill } from './run-recurring-rhythms.ts';
import { searchAndRetrieveContextSkill } from './search-and-retrieve-context.ts';
import { sequenceWithUnlocksSkill } from './sequence-with-unlocks.ts';
import { settleRumorIntoStructureSkill } from './settle-rumor-into-structure.ts';
import type { QuestlogSkillRegistry } from './skill_types.ts';
import { tagAndFilterPortfoliosSkill } from './tag-and-filter-portfolios.ts';

export const questlogSkills = [
	archiveDeleteAndPruneSkill,
	chooseWorkShapeSkill,
	clarifyAmbiguousRequestsSkill,
	closeWorkAndClaimOutcomesSkill,
	createConcreteQuestSkill,
	detectSlipsAndStalenessSkill,
	escalateAndUnblockSkill,
	frameInitiativeQuestlineSkill,
	handleExceptionsAndWeirdCasesSkill,
	intakeTriageSkill,
	maintainClearOwnershipSkill,
	manageApprovalsAndPromisesSkill,
	planSuccessorWorkSkill,
	planTimeCorrectlySkill,
	prioritizeAcrossStreamsSkill,
	protectCapacityAndFocusSkill,
	recoverFromModelingMistakesSkill,
	reportStatusAndManageExpectationsSkill,
	reviseOrReshapeCommitmentSkill,
	runOperationalReviewSkill,
	runRecurringRhythmsSkill,
	searchAndRetrieveContextSkill,
	sequenceWithUnlocksSkill,
	settleRumorIntoStructureSkill,
	tagAndFilterPortfoliosSkill,
] satisfies QuestlogSkillRegistry;

export function listQuestlogSkills() {
	return [...questlogSkills];
}

export function getQuestlogSkillByName(name: string) {
	return questlogSkills.find((skill) => skill.name === name) ?? null;
}
