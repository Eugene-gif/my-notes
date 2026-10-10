import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import IconControl from '@/assets/icons/IconControl.vue';

it('switches decorative button icons without adding focusable content', async () => {
	const wrapper = mount(IconControl, { props: { name: 'menu' } });
	const menu = wrapper.get('path').attributes('d');
	await wrapper.setProps({ name: 'more' });
	expect(wrapper.findAll('circle')).toHaveLength(3);
	expect(wrapper.find('path').exists()).toBe(false);
	await wrapper.setProps({ name: 'close' });
	const close = wrapper.get('path').attributes('d');
	await wrapper.setProps({ name: 'back' });
	expect(new Set([menu, close, wrapper.get('path').attributes('d')]).size).toBe(3);
	await wrapper.setProps({ name: 'user' });
	expect(wrapper.findAll('circle')).toHaveLength(1);
	expect(wrapper.get('circle').attributes('r')).toBe('4');
	expect(wrapper.attributes('aria-hidden')).toBe('true');
	expect(wrapper.attributes('focusable')).toBe('false');
});
