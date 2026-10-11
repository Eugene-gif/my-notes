import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import SubtaskEditor from '@/components/SubtaskEditor.vue';
import { subtasksFixture } from '../../fixtures';

it('adds focused rows with fresh IDs, edits and deletes without changing the provided array', async () => {
	const original = subtasksFixture();
	const wrapper = mount(SubtaskEditor, {
		props: {
			modelValue: original,
			'onUpdate:modelValue': (value) => wrapper.setProps({ modelValue: value }),
		},
		attachTo: document.body,
	});
	await wrapper.get('.subtask-editor__add').trigger('click');
	const fields = wrapper.findAll('input');
	expect(fields).toHaveLength(3);
	expect(document.activeElement).toBe(fields[2].element);
	expect(fields[2].attributes('required')).toBeDefined();
	await fields[2].setValue('Подзадача');
	const added = wrapper.props('modelValue')[2];
	expect(added).toMatchObject({ value: 'Подзадача', status: 'pending', completed: false });
	expect(original.some((item) => item.id === added.id)).toBe(false);
	await wrapper.get('[aria-label="Удалить подзадачу 2"]').trigger('click');
	expect(wrapper.props('modelValue').map((item) => item.id)).toEqual(['subtask1', added.id]);
	expect(wrapper.find('.subtask-editor__add').exists()).toBe(true);
	expect(original).toEqual(subtasksFixture());
});

it('keeps add available after deleting the final row', async () => {
	const wrapper = mount(SubtaskEditor, {
		props: {
			modelValue: subtasksFixture().slice(0, 1),
			'onUpdate:modelValue': (value) => wrapper.setProps({ modelValue: value }),
		},
	});
	await wrapper.get('.subtask-editor__remove').trigger('click');
	expect(wrapper.find('input').exists()).toBe(false);
	await wrapper.get('.subtask-editor__add').trigger('click');
	expect(wrapper.findAll('input')).toHaveLength(1);
});
