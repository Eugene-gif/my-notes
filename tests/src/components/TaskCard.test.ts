import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import TaskCard from '@/components/TaskCard.vue';
import { fixture } from '../../fixtures';

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
