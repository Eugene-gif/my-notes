import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import ContainerCard from '@/components/ContainerCard.vue';
import { useNotesStore } from '@/store/notesStore';
import { fixture } from '../../fixtures';

it.each(['folders', 'checklists', 'notes'] as const)(
	'orders %s actions with editing first and deletion last',
	async (collection) => {
		const state = fixture();
		useNotesStore().state = state;
		const wrapper = mount(ContainerCard, { props: { entry: state[collection][0] } });
		await wrapper.get('.folder__options').trigger('click');
		expect(wrapper.findAll('[role="menuitem"]').map((item) => item.text())).toEqual([
			'Изменить',
			'Открыть',
			'Выбрать',
			collection === 'folders'
				? 'Удалить папку'
				: collection === 'checklists'
					? 'Удалить перечень'
					: 'Удалить заметку',
		]);
	},
);

it('renders container summaries safely and separates navigation from selection', async () => {
	const state = fixture();
	useNotesStore().state = state;
	const wrapper = mount(ContainerCard, { props: { entry: state.notes[0] } });
	expect(wrapper.find('.folder__title').text()).toContain('<img');
	expect(wrapper.find('img').exists()).toBe(false);
	await wrapper.find('.folder__open').trigger('click');
	expect(wrapper.emitted('open')?.[0]).toEqual(['note']);
	await wrapper.setProps({ selecting: true, selected: true });
	await wrapper.find('.folder__open').trigger('click');
	expect(wrapper.emitted('select')?.[0]).toEqual(['note']);
	expect(wrapper.findComponent({ name: 'ActionMenu' }).exists()).toBe(false);
});
it('shows checklist completion and direct folder children', () => {
	const state = fixture();
	useNotesStore().state = state;
	const list = mount(ContainerCard, { props: { entry: state.checklists[0] } });
	expect(list.text()).toContain('Выполнено 1/2');
	expect(list.attributes('data-status')).toBe('partial');
	const folder = mount(ContainerCard, { props: { entry: state.folders[0] } });
	expect(folder.text()).toContain('2 элемента');
});

it('disables selection while a clipboard is awaiting paste without disabling navigation', async () => {
	const state = fixture();
	useNotesStore().state = state;
	const wrapper = mount(ContainerCard, {
		props: { entry: state.folders[0], selectionDisabled: true },
	});
	await wrapper.get('.folder__options').trigger('click');
	const select = wrapper.findAll('[role="menuitem"]').find((item) => item.text() === 'Выбрать')!;
	expect(select.attributes('disabled')).toBeDefined();
	await select.trigger('click');
	expect(wrapper.emitted('action')).toBeUndefined();
	await wrapper.get('.folder__open').trigger('click');
	expect(wrapper.emitted('open')?.[0]).toEqual(['folder']);
});
