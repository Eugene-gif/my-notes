import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import type { Ref } from 'vue';
import { PWA_KEY } from '@/constants/pwa';

import EntryForm from '@/components/EntryForm.vue';
import { fixture, subtasksFixture } from '../../fixtures';

it('keeps note edits as a draft until explicit save or cancel', async () => {
	const note = fixture().notes[0];
	const wrapper = mount(EntryForm, { props: { type: 'note', entry: note } });
	await wrapper.find('input').setValue('Черновик');
	await wrapper.find('textarea').setValue('Новый текст');
	expect(note.name).not.toBe('Черновик');
	await wrapper.find('form').trigger('submit');
	expect(wrapper.emitted('save')?.[0]).toEqual(['Черновик', 'Новый текст']);
	await wrapper.find('.btn-note-cancel').trigger('click');
	expect(wrapper.emitted('cancel')).toHaveLength(1);
});
it('uses a single-line input and rejects blank tasks', async () => {
	const wrapper = mount(EntryForm, { props: { type: 'task' } });
	expect(wrapper.find('textarea').exists()).toBe(false);
	expect(wrapper.get('input').attributes('required')).toBeDefined();
	await wrapper.find('input').setValue(' ');
	await wrapper.find('form').trigger('submit');
	expect(wrapper.emitted('save')).toBeUndefined();
	await wrapper.find('input').setValue('Новая задача');
	await wrapper.find('form').trigger('submit');
	expect(wrapper.emitted('save')?.[0]).toEqual(['Новая задача', '', []]);
});

it('edits tasks through the input and preserves the original draft until save', async () => {
	const task = fixture().tasks[0];
	const wrapper = mount(EntryForm, { props: { type: 'task', entry: task } });
	expect(wrapper.get('input').element.value).toBe(task.value);
	await wrapper.get('input').setValue('Изменённая задача');
	expect(task.value).toBe('Купить молоко');
	await wrapper.get('form').trigger('submit');
	expect(wrapper.emitted('save')?.[0]).toEqual(['Изменённая задача', '', []]);
});

it.each(['\n', '\r\n', '\r'])(
	'preserves multiline task text when editing %j line breaks',
	async (lineBreak) => {
		const task = { ...fixture().tasks[0], value: 'Купить хлеб' + lineBreak + 'Купить молоко' };
		const wrapper = mount(EntryForm, { props: { type: 'task', entry: task } });
		const field = wrapper.get('textarea');
		expect(wrapper.find('input').exists()).toBe(false);
		expect(field.element.value).toBe('Купить хлеб\nКупить молоко');
		await wrapper.get('form').trigger('submit');
		expect(wrapper.emitted('save')?.[0]).toEqual([task.value, '', []]);
		await field.setValue(field.element.value + '!');
		await wrapper.get('form').trigger('submit');
		expect(wrapper.emitted('save')?.[1]).toEqual(['Купить хлеб\nКупить молоко!', '', []]);
		expect(task.value).toBe('Купить хлеб' + lineBreak + 'Купить молоко');
	},
);

it('keeps the multiline editor while changing or removing line breaks in its draft', async () => {
	const task = { ...fixture().tasks[0], value: 'Первая строка\nВторая строка' };
	const wrapper = mount(EntryForm, { props: { type: 'task', entry: task } });
	await wrapper.get('textarea').setValue('Одна строка');
	expect(wrapper.find('input').exists()).toBe(false);
	await wrapper.get('textarea').setValue('Новая строка\nЕщё одна');
	await wrapper.get('form').trigger('submit');
	expect(wrapper.emitted('save')?.[0]).toEqual(['Новая строка\nЕщё одна', '', []]);
});

it('keeps subtask edits isolated until save and rejects empty rows', async () => {
	const task = { ...fixture().tasks[0], subtasks: subtasksFixture() };
	task.subtasks[0].status = 'completed';
	task.subtasks[0].completed = true;
	const original = structuredClone(task);
	const wrapper = mount(EntryForm, { props: { type: 'task', entry: task } });
	await wrapper.get('.subtask-editor__field input').setValue('Другой текст');
	await wrapper.get('.subtask-editor__add').trigger('click');
	await wrapper.get('form').trigger('submit');
	expect(wrapper.emitted('save')).toBeUndefined();
	const fields = wrapper.findAll('.subtask-editor__field input');
	await fields[2].setValue('Новая подзадача');
	await wrapper.get('form').trigger('submit');
	expect(wrapper.emitted('save')?.[0]?.[2]).toMatchObject([
		{ id: 'subtask1', value: 'Другой текст', status: 'completed', completed: true },
		{ id: 'subtask2' },
		{ value: 'Новая подзадача', status: 'pending', completed: false },
	]);
	expect(task).toEqual(original);
	await wrapper.get('.btn-note-cancel').trigger('click');
	expect(task).toEqual(original);
});

it('includes adding and removing subtasks in the unsaved draft guard', async () => {
	const release = vi.fn();
	const trackDraft = vi.fn((_dirty: Ref<boolean>) => release);
	const wrapper = mount(EntryForm, {
		props: { type: 'task' },
		global: { provide: { [PWA_KEY as symbol]: { trackDraft } } },
	});
	const dirty = trackDraft.mock.calls[0][0];
	expect(dirty.value).toBe(false);
	await wrapper.get('.subtask-editor__add').trigger('click');
	expect(dirty.value).toBe(true);
	await wrapper.get('.subtask-editor__remove').trigger('click');
	expect(dirty.value).toBe(false);
	wrapper.unmount();
	expect(release).toHaveBeenCalledOnce();
});
