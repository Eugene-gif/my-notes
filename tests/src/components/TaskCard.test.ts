import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import TaskCard from '@/components/TaskCard.vue';
import { fixture, subtasksFixture } from '../../fixtures';

it('orders task actions with editing first and deletion last', async () => {
	const wrapper = mount(TaskCard, { props: { entry: fixture().tasks[0] } });
	await wrapper.get('.folder__options').trigger('click');
	expect(wrapper.findAll('[role="menuitem"]').map((item) => item.text())).toEqual([
		'Изменить',
		'Выбрать',
		'Удалить',
	]);
});

it('emits status changes and selection with accessible status labels', async () => {
	const task = { ...fixture().tasks[0], value: '<script>text</script>' };
	const wrapper = mount(TaskCard, { props: { entry: task } });
	expect(wrapper.find('script').exists()).toBe(false);
	await wrapper.find('.task__toggle').trigger('click');
	expect(wrapper.emitted('toggle')?.[0]).toEqual(['task']);
	await wrapper.setProps({
		entry: { ...task, status: 'in-progress' },
		selecting: true,
		selected: true,
	});
	expect(wrapper.find('.task__toggle').attributes('aria-pressed')).toBe('mixed');
	await wrapper.find('.task__toggle').trigger('click');
	expect(wrapper.emitted('select')?.[0]).toEqual(['task']);
});

it('disables new selection while a clipboard is pending', async () => {
	const wrapper = mount(TaskCard, {
		props: { entry: fixture().tasks[0], selectionDisabled: true },
	});
	await wrapper.get('.folder__options').trigger('click');
	const select = wrapper.findAll('[role="menuitem"]').find((item) => item.text() === 'Выбрать')!;
	expect(select.attributes('disabled')).toBeDefined();
	await select.trigger('click');
	expect(wrapper.emitted('action')).toBeUndefined();
});

it('toggles subtask expansion from the task button and card without changing the parent status', async () => {
	const wrapper = mount(TaskCard, {
		props: { entry: { ...fixture().tasks[0], subtasks: subtasksFixture() } },
	});
	expect(wrapper.get('.task__expand').attributes('aria-expanded')).toBe('false');
	expect(wrapper.get('.task__toggle').attributes('aria-expanded')).toBe('false');
	expect(wrapper.get('.task__toggle').attributes('aria-disabled')).toBeUndefined();
	await wrapper.get('.task__toggle').trigger('click');
	expect(wrapper.emitted('toggle')).toBeUndefined();
	expect(wrapper.classes()).toContain('is-expanded');
	expect(wrapper.get('.task__toggle').attributes('aria-expanded')).toBe('true');
	expect(wrapper.get('.task__toggle').attributes('aria-label')).toContain('Свернуть задачу');
	await wrapper.get('.subtask__toggle').trigger('click');
	expect(wrapper.emitted('toggle-subtask')).toEqual([['task', 'subtask1']]);
	expect(wrapper.emitted('toggle')).toBeUndefined();
	expect(wrapper.classes()).toContain('is-expanded');
	await wrapper.trigger('click');
	expect(wrapper.classes()).not.toContain('is-expanded');
	await wrapper.trigger('click');
	expect(wrapper.classes()).toContain('is-expanded');
	await wrapper.get('.folder__options').trigger('click');
	expect(wrapper.classes()).toContain('is-expanded');
	await wrapper.findAll('[role="menuitem"]')[0].trigger('click');
	expect(wrapper.emitted('action')).toEqual([['edit', 'task']]);
	expect(wrapper.classes()).toContain('is-expanded');
	await wrapper.get('.task__expand').trigger('click');
	expect(wrapper.classes()).not.toContain('is-expanded');
	await wrapper.setProps({ selecting: true });
	expect(wrapper.find('.task__expand').exists()).toBe(false);
	await wrapper.get('.task__toggle').trigger('click');
	expect(wrapper.emitted('select')).toEqual([['task']]);
	expect(wrapper.classes()).not.toContain('is-expanded');
});
