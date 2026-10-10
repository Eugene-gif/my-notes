import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { nextTick } from 'vue';
import DropActionMenu from '@/components/DropActionMenu.vue';
import { fixture } from '../../fixtures';
import { useNotesStore } from '@/store/notesStore';

it('allows valid movement, rejects group swap and cancels with Escape', async () => {
	useNotesStore().state = fixture();
	const pending = {
		ids: ['note', 'list'],
		destination: {
			type: 'folder' as const,
			parentId: 'folder',
			element: document.createElement('li'),
			dropPoint: { x: 100, y: 100 },
		},
	};
	const wrapper = mount(DropActionMenu, {
		props: { pending },
		global: { stubs: { Teleport: true } },
	});
	await nextTick();
	const items = wrapper.findAll('button');
	expect(items[0].attributes('disabled')).toBeUndefined();
	expect(items[1].attributes('disabled')).toBeDefined();
	await items[0].trigger('click');
	expect(wrapper.emitted('choose')?.[0]).toEqual(['move']);
	document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
	expect(wrapper.emitted('cancel')).toHaveLength(1);
});
