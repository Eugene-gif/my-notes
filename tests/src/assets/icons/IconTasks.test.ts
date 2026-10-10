import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import IconTasks from '@/assets/icons/IconTasks.vue';

it('updates the checklist drawing for all three aggregate statuses', async () => {
	const wrapper = mount(IconTasks);
	const empty = wrapper.get('path').attributes('d');
	await wrapper.setProps({ status: 'partial' });
	const partial = wrapper.get('path').attributes('d');
	await wrapper.setProps({ status: 'complete' });
	expect(new Set([empty, partial, wrapper.get('path').attributes('d')]).size).toBe(3);
	expect(wrapper.attributes('viewBox')).toBe('0 0 512 512');
	expect(wrapper.attributes('aria-hidden')).toBe('true');
});
