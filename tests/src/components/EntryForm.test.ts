import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import EntryForm from '@/components/EntryForm.vue';
import { fixture } from '../../fixtures';

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
	expect(wrapper.emitted('save')?.[0]).toEqual(['Новая задача', '']);
});

it('edits tasks through the input and preserves the original draft until save', async () => {
	const task = fixture().tasks[0];
	const wrapper = mount(EntryForm, { props: { type: 'task', entry: task } });
	expect(wrapper.get('input').element.value).toBe(task.value);
	await wrapper.get('input').setValue('Изменённая задача');
	expect(task.value).toBe('Купить молоко');
	await wrapper.get('form').trigger('submit');
	expect(wrapper.emitted('save')?.[0]).toEqual(['Изменённая задача', '']);
});
