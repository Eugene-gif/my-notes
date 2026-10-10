import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { nextTick } from 'vue';
import IconContainer from '@/assets/icons/IconContainer.vue';
import IconFolder from '@/assets/icons/IconFolder.vue';
import IconTasks from '@/assets/icons/IconTasks.vue';
import IconText from '@/assets/icons/IconText.vue';
import { useNotesStore } from '@/store/notesStore';
import { fixture } from '../../../fixtures';

it('chooses the container icon and preserves its card or breadcrumb class', async () => {
	const state = fixture();
	useNotesStore().state = state;
	const wrapper = mount(IconContainer, {
		props: { entry: state.notes[0] },
		attrs: { class: 'todo__path-icon' },
	});
	expect(wrapper.findComponent(IconText).exists()).toBe(true);
	await wrapper.setProps({ entry: state.folders[0], open: true });
	expect(wrapper.getComponent(IconFolder).props()).toEqual({ open: true, empty: false });
	expect(wrapper.get('svg').classes()).toContain('todo__path-icon');
	await wrapper.setProps({ entry: state.checklists[0] });
	expect(wrapper.getComponent(IconTasks).props('status')).toBe('partial');
	expect(wrapper.get('svg').classes()).toContain('todo__path-icon');
});

it('reacts to child moves and task status changes in the store', async () => {
	const notes = useNotesStore();
	notes.state = fixture();
	const wrapper = mount(IconContainer, { props: { entry: notes.state.folders[0] } });
	notes.state.folders[1].parentId = null;
	notes.state.checklists[1].parentId = null;
	await nextTick();
	expect(wrapper.getComponent(IconFolder).props('empty')).toBe(true);
	await wrapper.setProps({ entry: notes.state.checklists[0] });
	notes.state.tasks[0].status = 'completed';
	await nextTick();
	expect(wrapper.getComponent(IconTasks).props('status')).toBe('complete');
	expect(wrapper.get('svg').attributes('data-status')).toBe('complete');
	for (const task of notes.state.tasks) task.status = 'pending';
	await nextTick();
	expect(wrapper.getComponent(IconTasks).props('status')).toBe('empty');
	expect(wrapper.get('svg').attributes('data-status')).toBe('empty');
});
