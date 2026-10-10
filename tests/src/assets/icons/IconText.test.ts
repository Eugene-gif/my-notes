import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import IconText from '@/assets/icons/IconText.vue';

it('renders the decorative note drawing and accepts the card class', () => {
	const wrapper = mount(IconText, { attrs: { class: 'folder__icon' } });
	expect(wrapper.element.tagName).toBe('svg');
	expect(wrapper.attributes('aria-hidden')).toBe('true');
	expect(wrapper.classes()).toContain('folder__icon');
	expect(wrapper.get('path').attributes('fill')).toBe('currentColor');
});
