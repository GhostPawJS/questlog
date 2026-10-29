import assert from 'node:assert/strict';
import { it } from 'node:test';
import { textOutput } from './text_output.ts';

it('renders nested results as indented text with local times and joined lists', () => {
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
			`createdAt: ${new Date(1793147087065).toLocaleString('en-GB', { timeZoneName: 'short' })}`,
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
