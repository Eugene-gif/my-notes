import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import EntryList from '@/components/EntryList.vue';
import { fixture } from '../../fixtures';
import { useNotesStore } from '@/store/notesStore';

it('renders keyed task cards and top/bottom insertion controls', async () => {
	const state = fixture();
	useNotesStore().state = state;
	const wrapper = mount(EntryList, {
		props: {
			entries: state.tasks.slice(0, 2),
			currentId: 'list',
			checklist: true,
			layout: '3',
			selecting: false,
			selected: new Set<string>(),
		},
	});
	expect(wrapper.find('ul').attributes('data-layout')).toBe('1');
	expect(wrapper.findAll('.task')).toHaveLength(2);
	const add = wrapper.findAll('.todo__add-task');
	await add[0].trigger('click');
	await add[1].trigger('click');
	expect(wrapper.emitted('add')).toEqual([['before'], ['after']]);
	await wrapper.find('.task__toggle').trigger('click');
	expect(wrapper.emitted('toggle')?.[0]).toEqual(['task']);
});
it('shows an empty folder and disables task insertion during selection', async () => {
	const wrapper = mount(EntryList, {
		props: {
			entries: [],
			currentId: 'folder',
			checklist: false,
			layout: '2',
			selecting: false,
			selected: new Set<string>(),
		},
	});
	expect(wrapper.text()).toContain('Папка пуста');
	await wrapper.setProps({ checklist: true, selecting: true });
	await wrapper.find('.todo__add-task').trigger('click');
	expect(wrapper.emitted('add')).toBeUndefined();
});
