import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import IconHome from '@/assets/icons/IconHome.vue';

it('renders the decorative home drawing with inherited color', () => {
	const wrapper = mount(IconHome);
	expect(wrapper.element.tagName).toBe('svg');
	expect(wrapper.attributes('aria-hidden')).toBe('true');
	expect(wrapper.attributes('focusable')).toBe('false');
	expect(wrapper.get('path').attributes('fill')).toBe('currentColor');
});
