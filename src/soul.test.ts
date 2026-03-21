import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	questlogSoul,
	questlogSoulEssence,
	questlogSoulTraits,
	renderQuestlogSoulPromptFoundation,
} from './soul.ts';

describe('questlog soul', () => {
	it('exports the canonical soul shape and selected traits', () => {
		strictEqual(questlogSoul.slug, 'steward');
		strictEqual(questlogSoul.name, 'Steward');
		strictEqual(questlogSoul.essence, questlogSoulEssence);
		strictEqual(questlogSoul.traits, questlogSoulTraits);
		strictEqual(questlogSoul.traits.length, 4);
	});

	it('renders a prompt foundation that includes the essence and every trait', () => {
		const prompt = renderQuestlogSoulPromptFoundation();

		ok(prompt.includes('Steward (steward)'));
		ok(prompt.includes(questlogSoulEssence.slice(0, 80)));
		for (const trait of questlogSoulTraits) {
			ok(prompt.includes(trait.principle));
			ok(prompt.includes(trait.provenance));
		}
	});
});
