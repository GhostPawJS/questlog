import { captureRumor } from '../rumors/capture_rumor.ts';
import type { CaptureRumorInput } from '../rumors/types.ts';
import { translateToolError } from './tool_errors.ts';
import { defineQuestlogTool, integerSchema, objectSchema, stringSchema } from './tool_metadata.ts';
import { captureRumorToolName, shapeWorkToolName } from './tool_names.ts';
import { inspectItemNext, useToolNext } from './tool_next.ts';
import { toRumorRef } from './tool_ref.ts';
import type { ToolResult } from './tool_types.ts';
import { toolSuccess } from './tool_types.ts';

export interface CaptureRumorToolData {
	rumor: ReturnType<typeof captureRumor>;
}

export type CaptureRumorToolResult = ToolResult<CaptureRumorToolData>;

export function captureRumorToolHandler(
	db: Parameters<typeof captureRumor>[0],
	input: CaptureRumorInput,
): CaptureRumorToolResult {
	try {
		const rumor = captureRumor(db, input);
		const rumorRef = toRumorRef(rumor);
		return toolSuccess(
			`Captured rumor \`${rumor.title}\`.`,
			{ rumor },
			{
				entities: [rumorRef],
				next: [
					inspectItemNext(rumorRef),
					useToolNext(
						shapeWorkToolName,
						'Settle, dismiss, or reopen this rumor later when its next action is clear.',
						{
							action: 'settle_rumor',
							rumorId: rumor.id,
						},
					),
				],
			},
		);
	} catch (error) {
		return translateToolError(error, { summary: 'Could not capture the rumor.' });
	}
}

export const captureRumorTool = defineQuestlogTool<CaptureRumorInput, CaptureRumorToolResult>({
	name: captureRumorToolName,
	description:
		'Capture uncertain incoming work as a rumor so it can be triaged later without prematurely turning it into committed execution.',
	whenToUse:
		'Use this when something matters enough to record but is not yet ready to become a quest or questline.',
	whenNotToUse:
		'Do not use this for already-committed work that should be created directly as a quest or questline.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['rumor'],
	inputDescriptions: {
		title: 'Short rumor title describing the incoming signal or possible work.',
		details: 'Optional supporting context that explains why the rumor might matter.',
		now: 'Optional creation timestamp for the rumor.',
	},
	outputDescription:
		'Returns the captured rumor, its ref, and follow-up hints for inspecting or later shaping the rumor into real work.',
	inputSchema: objectSchema(
		{
			title: stringSchema('Short rumor title describing the incoming signal or possible work.'),
			details: stringSchema(
				'Optional supporting context that explains why the rumor might matter.',
			),
			now: integerSchema('Optional creation timestamp for the rumor.'),
		},
		['title'],
		'Capture uncertain incoming work as a rumor.',
	),
	handler: captureRumorToolHandler,
});
