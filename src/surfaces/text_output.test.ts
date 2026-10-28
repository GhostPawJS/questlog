import assert from 'node:assert/strict';
import { it } from 'node:test';
import { textOutput } from './text_output.ts';

it('renders nested results as indented text with ISO times and joined lists', () => {
	const text = textOutput({
		id: 1,
		events: ['quest.due', 'rumor.captured'],
		headers: { authorization: '***' },
		createdAt: 1793147087065,
		tag: null,
		items: [{ id: 'a' }, { id: 'b' }],
	});
	assert.equal(
		text,
		[
			'id: 1',
			'events: quest.due, rumor.captured',
			'headers:',
			'  authorization: ***',
			'createdAt: 2026-10-28T00:24:47.065Z',
			'tag: -',
			'items:',
			'  id: a',
			'',
			'  id: b',
		].join('\n'),
	);
	assert.equal(textOutput([]), 'None');
	assert.equal(textOutput(null), '-');
	assert.equal(textOutput({ list: [] }), 'list: none');
});
