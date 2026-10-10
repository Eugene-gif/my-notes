import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import TaskCard from '@/components/TaskCard.vue';
import { fixture } from '../../fixtures';

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
