import type { QuestlogDb } from '../database.ts';
import type { SurfaceTool } from '../surfaces/surface_types.ts';
import { questlogTools } from '../tools/tool_registry.ts';

export const questlogSurfaceTools: readonly SurfaceTool<QuestlogDb>[] = questlogTools.map(
	(tool) => ({
		name: tool.name,
		description: tool.description,
		whenToUse: tool.whenToUse,
		whenNotToUse: tool.whenNotToUse ?? '',
		readOnly: tool.readOnly,
		sideEffects: tool.sideEffects,
		inputSchema: { ...tool.inputSchema, type: 'object' },
		handler: tool.handler as SurfaceTool<QuestlogDb>['handler'],
	}),
);
