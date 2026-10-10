import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import IconTaskStatus from '@/assets/icons/IconTaskStatus.vue';

it('omits pending status, switches drawings and restores parent styling on updates', async () => {
	const wrapper = mount(IconTaskStatus, {
		props: { status: 'pending' },
		attrs: { class: 'task__check' },
	});
	expect(wrapper.find('svg').exists()).toBe(false);
	await wrapper.setProps({ status: 'in-progress' });
	const progress = wrapper.get('path').attributes('d');
	expect(wrapper.get('svg').classes()).toContain('task__check');
	expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true');
	await wrapper.setProps({ status: 'completed' });
	expect(wrapper.get('circle').attributes('r')).toBe('9');
	expect(wrapper.get('path').attributes('d')).not.toBe(progress);
	await wrapper.setProps({ status: 'pending' });
	expect(wrapper.find('svg').exists()).toBe(false);
});
